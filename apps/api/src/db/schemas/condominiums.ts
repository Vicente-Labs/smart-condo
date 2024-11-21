import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { announcements } from './announcements'
import { bookings } from './bookings'
import { commonSpaces } from './common-spaces'
import { invites } from './invites'
import { users } from './users'

export const condominiums = pgTable('condominiums', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  name: text('name').notNull(),
  description: text('description'),

  logoUrl: text('logo_url'),

  ownerId: text('owner_id')
    .references(() => users.id)
    .notNull(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const condominiumsRelations = relations(
  condominiums,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [condominiums.ownerId],
      references: [users.id],
    }),
    invites: many(invites),
    commonSpaces: many(commonSpaces),
    announcements: many(announcements),
    bookings: many(bookings),
  }),
)
