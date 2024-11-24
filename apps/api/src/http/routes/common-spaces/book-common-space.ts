import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { bookings, commonSpaces, condominiumResidents } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'
import { commonSpaceSchema } from '~/packages/auth/src'

export async function bookCommonSpaceRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/common-spaces/:id/book',
      {
        schema: {
          tags: ['common-spaces'],
          summary: 'Book a common space',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string(),
          }),
          body: z.object({
            date: z.coerce.date(),
            estimatedParticipants: z.number(),
          }),
          response: {
            201: z.object({
              message: z.literal('Booking created successfully'),
              bookingId: z.string(),
            }),
            400: z.object({
              message: z.literal('Common space not found'),
            }),
            401: z.object({
              message: z.tuple([
                z.literal('Invalid auth token.'),
                z.literal('You are not allowed to book this common space'),
              ]),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()
        const { id } = req.params
        const commonSpace = await db
          .select()
          .from(condominiumResidents)
          .where(eq(condominiumResidents.userId, userId))
          .leftJoin(
            commonSpaces,
            and(
              eq(
                commonSpaces.condominiumId,
                condominiumResidents.condominiumId,
              ),
              eq(commonSpaces.id, id),
            ),
          )

        if (!commonSpace || commonSpace.length <= 0)
          throw new BadRequestError('Common space not found')

        const { condominium } = await req.getUserMembership(
          commonSpace[0].condominium_residents.condominiumId,
        )

        const { cannot } = getPermissions(userId, condominium.role)

        const authCommonSpace = commonSpaceSchema.parse({
          condominiumId: condominium.id,
          isCondominiumResident: true,
          isActive: commonSpace[0].common_spaces?.available,
        })

        if (cannot('book', authCommonSpace))
          throw new UnauthorizedError(
            'You are not allowed to book this common space',
          )

        const { date, estimatedParticipants } = req.body

        const booking = await db
          .insert(bookings)
          .values({
            commonSpaceId: id,
            condominiumId: condominium.id,
            userId,
            estimatedParticipants,
            date,
          })
          .returning()

        return res.status(201).send({
          message: 'Booking created successfully',
          bookingId: booking[0].id,
        })
      },
    )
}
