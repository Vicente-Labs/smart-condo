import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { announcements } from './announcements'
import { bookings } from './bookings'
import { commonSpaces } from './common-spaces'
import { invites } from './invites'
import { users } from './users'

export const condominiums = pgTable(
  'condominiums',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey(),

    name: text('name').notNull(),
    description: text('description'),
    address: text('address').notNull().unique(),

    logoUrl: text('logo_url'),

    ownerId: text('owner_id')
      .references(() => users.id)
      .notNull(),

    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    addressIdx: index('address_idx').on(table.address),
    ownerIdIdx: index('owner_id_idx').on(table.ownerId),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  }),
)

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
