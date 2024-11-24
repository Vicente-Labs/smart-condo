import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { commonSpaces, condominiums } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'

export async function makeCommonSpaceUnavailableRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/common-spaces/:id/inactivate',
      {
        schema: {
          tags: ['common-spaces'],
          summary: 'Make a common space unavailable',
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string(),
          }),
          response: {
            204: z.object({
              message: z.literal('Common space inactivated successfully'),
            }),
            400: z.object({
              message: z.literal('Common space not found'),
            }),
            401: z.object({
              message: z.tuple([
                z.literal(
                  'You are not allowed to inactivate this common space',
                ),
                z.literal('Invalid auth token'),
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

        const queriedCommonSpace = await db
          .select()
          .from(commonSpaces)
          .where(eq(commonSpaces.id, id))
          .leftJoin(
            condominiums,
            eq(commonSpaces.condominiumId, condominiums.id),
          )

        if (
          !queriedCommonSpace ||
          queriedCommonSpace.length <= 0 ||
          !queriedCommonSpace[0].condominiums
        )
          throw new BadRequestError('Common space not found')

        const { condominium } = await req.getUserMembership(
          queriedCommonSpace[0].condominiums.id,
        )

        const { cannot } = getPermissions(userId, condominium.role)

        if (cannot('update', 'common_spaces'))
          throw new UnauthorizedError(
            `You are not allowed to inactivate this common space`,
          )

        await db
          .update(commonSpaces)
          .set({
            available: false,
          })
          .where(eq(commonSpaces.id, id))

        return res.status(201).send({
          message: 'Common space inactivated successfully',
        })
      },
    )
}
