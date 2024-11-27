import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { bookings, commonSpaces } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, getCache, invalidateCache, setCache } from '@/redis'
import { notifications } from '@/utils/notifications-pub-sub'

export async function revokeBookingRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .delete(
      '/bookings/:bookingId/revoke',
      {
        schema: {
          tags: ['bookings'],
          summary: 'Revoke a booking',
          security: [{ bearerAuth: [] }],
          params: z.object({
            bookingId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Booking revoked successfully'),
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

        const { bookingId } = req.params

        const booking = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, bookingId))
          .leftJoin(commonSpaces, eq(bookings.commonSpaceId, commonSpaces.id))

        if (!booking || booking.length <= 0 || !booking[0].common_spaces)
          throw new BadRequestError('Booking not found')

        const [deletedBooking] = await db
          .delete(bookings)
          .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))
          .returning()

        const cachedBookings = await getCache<(typeof bookings.$inferSelect)[]>(
          CACHE_KEYS.bookings(userId, deletedBooking.condominiumId),
        )

        const filteredBookings = cachedBookings?.filter(
          (booking) => booking.id !== deletedBooking.id,
        )

        if (filteredBookings) {
          await setCache(
            CACHE_KEYS.bookings(userId, deletedBooking.condominiumId),
            JSON.stringify(filteredBookings),
          )
        } else {
          await invalidateCache(
            CACHE_KEYS.bookings(userId, deletedBooking.condominiumId),
          )
        }

        await invalidateCache(CACHE_KEYS.booking(userId, deletedBooking.id))

        await notifications.publish({
          type: 'BOOKING_REVOKED',
          notificationTo: 'user',
          data: {
            bookingId: deletedBooking.id,
            condominiumId: deletedBooking.condominiumId,
            commonSpaceId: deletedBooking.commonSpaceId,
            commonSpaceName: booking[0].common_spaces.name,
            bookingTime: deletedBooking.date,
          },
          channel: 'all',
        })

        return res.status(200).send({
          message: 'Booking revoked successfully',
        })
      },
    )
}
