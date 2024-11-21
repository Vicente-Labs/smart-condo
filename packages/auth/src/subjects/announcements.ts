import { z } from 'zod'

import { announcementSchema } from '../models/announcement'

export const announcementSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.union([z.literal('announcements'), announcementSchema]),
])

export type AnnouncementSubject = z.infer<typeof announcementSubject>
