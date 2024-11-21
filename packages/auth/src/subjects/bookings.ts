import { z } from 'zod'

import { bookingSchema } from '../models/booking'

export const bookingsSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
    z.literal('revoke'),
  ]),
  z.union([z.literal('bookings'), bookingSchema]),
])

export type BookingsSubject = z.infer<typeof bookingsSubject>
