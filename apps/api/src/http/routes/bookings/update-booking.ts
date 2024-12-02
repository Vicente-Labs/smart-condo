import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { bookings } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, getCache, invalidateCache, setCache } from '@/redis'

export async function updateBookingRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/bookings/:bookingId ',
      {
        schema: {
          tags: ['bookings'],
          summary: 'Update a booking',
          security: [{ bearerAuth: [] }],
          params: z.object({
            bookingId: z.string(),
          }),
          body: z.object({
            date: z.coerce.date(),
            estimatedParticipants: z.number(),
          }),
          response: {
            200: z.object({
              message: z.literal('Booking updated successfully'),
            }),
            400: z.object({
              message: z.union([
                z.literal('Invalid date'),
                z.literal('Invalid estimated participants'),
                z.literal('Booking not found'),
                z.string(),
              ]),
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

        const { date, estimatedParticipants } = req.body

        const booking = await db
          .select()
          .from(bookings)
          .where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId)))

        if (!booking) throw new BadRequestError('Booking not found')

        const [updatedBooking] = await db
          .update(bookings)
          .set({ date, estimatedParticipants })
          .where(eq(bookings.id, bookingId))
          .returning()

        const cachedBookings = await getCache<(typeof bookings.$inferSelect)[]>(
          CACHE_KEYS.bookings(userId, updatedBooking.condominiumId),
        )

        const filteredBookings = cachedBookings?.filter(
          (booking) => booking.id !== updatedBooking.id,
        )

        if (filteredBookings) {
          await setCache(
            CACHE_KEYS.bookings(userId, updatedBooking.condominiumId),
            JSON.stringify(filteredBookings),
          )
        } else {
          await invalidateCache(
            CACHE_KEYS.bookings(userId, updatedBooking.condominiumId),
          )
        }

        await setCache(
          CACHE_KEYS.booking(userId, bookingId),
          JSON.stringify(updatedBooking),
        )

        return res.status(200).send({
          message: 'Booking updated successfully',
        })
      },
    )
}
