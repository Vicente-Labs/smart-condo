import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { condominiums } from './condominiums'
import { users } from './users'

export const announcements = pgTable('announcements', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  title: text('title').notNull(),
  content: text('content').notNull(),

  condominiumId: text('condominium_id')
    .references(() => condominiums.id)
    .notNull(),
  announcerId: text('announcer_id')
    .references(() => users.id)
    .notNull(),

  announcementDate: timestamp('announcement_date').notNull(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const announcementsRelations = relations(announcements, ({ one }) => ({
  condominium: one(condominiums, {
    fields: [announcements.id],
    references: [condominiums.id],
  }),
  announcer: one(users, {
    fields: [announcements.announcerId],
    references: [users.id],
  }),
}))
