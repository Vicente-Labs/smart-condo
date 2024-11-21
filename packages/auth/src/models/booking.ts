import { z } from 'zod'

export const bookingSchema = z.object({
  __typename: z.literal('bookings').default('bookings'),
  id: z.string(),
  commonSpaceId: z.string(),
  ownerId: z.string(),
  date: z.coerce.date(),
  isCondominiumResident: z.boolean().default(false),
})

export type Booking = z.infer<typeof bookingSchema>
