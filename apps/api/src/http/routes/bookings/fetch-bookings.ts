import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { bookings } from '@/db/schemas'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, getCache, setCache } from '@/redis'

export async function fetchBookingsRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/condominium/:condominiumId/bookings',
      {
        schema: {
          tags: ['bookings'],
          summary: 'Fetch bookings for a condominium',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Bookings fetched successfully'),
              bookings: z
                .object({
                  id: z.string(),
                  userId: z.string(),
                  condominiumId: z.string(),
                  commonSpaceId: z.string(),
                  estimatedParticipants: z.number(),
                  date: z.coerce.date(),
                  updatedAt: z.coerce.date(),
                  createdAt: z.coerce.date(),
                })
                .array(),
            }),
            400: z.object({
              message: z.string(),
            }),
            401: z.object({
              message: z.literal('Invalid auth token'),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()

        const { condominiumId } = req.params

        const cachedBookings = await getCache<(typeof bookings.$inferSelect)[]>(
          CACHE_KEYS.bookings(userId, condominiumId),
        )

        if (cachedBookings)
          return res.status(200).send({
            message: 'Bookings fetched successfully',
            bookings: cachedBookings,
          })

        const queriedBookings = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, userId),
              eq(bookings.condominiumId, condominiumId),
            ),
          )

        await setCache(
          CACHE_KEYS.bookings(userId, condominiumId),
          JSON.stringify(queriedBookings),
          'LONG',
        )

        return res.status(200).send({
          message: 'Bookings fetched successfully',
          bookings: queriedBookings,
        })
      },
    )
}
