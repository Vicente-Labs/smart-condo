import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { commonSpaces } from './common-spaces'
import { condominiums } from './condominiums'
import { users } from './users'

export const bookings = pgTable('bookings', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  date: timestamp('date').notNull(),

  estimatedParticipants: integer('estimated_participants').notNull(),

  commonSpaceId: text('common_space_id')
    .references(() => commonSpaces.id, { onDelete: 'cascade' })
    .notNull(),
  condominiumId: text('condominium_id')
    .references(() => condominiums.id, { onDelete: 'cascade' })
    .notNull(),

  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const bookingsRelations = relations(bookings, ({ one }) => ({
  commonSpace: one(commonSpaces, {
    fields: [bookings.commonSpaceId],
    references: [commonSpaces.id],
  }),
  condominium: one(condominiums, {
    fields: [bookings.condominiumId],
    references: [condominiums.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}))
