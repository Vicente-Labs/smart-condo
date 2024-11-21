import { z } from 'zod'

export const announcementSchema = z.object({
  __typename: z.literal('announcements').default('announcements'),
  id: z.string(),
  condominiumId: z.string(),
  authorId: z.string(),
  publishedDate: z.coerce.date(),
  isCondominiumResident: z.boolean().default(false),
})

export type Announcement = z.infer<typeof announcementSchema>
