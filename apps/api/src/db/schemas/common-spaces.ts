import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { bookings } from './bookings'
import { condominiums } from './condominiums'

export const commonSpaces = pgTable('common_spaces', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  name: text('name').notNull(),
  description: text('description'),

  available: boolean('available').notNull().default(true),
  capacity: integer('capacity').notNull(),

  condominiumId: text('condominium_id')
    .references(() => condominiums.id)
    .notNull(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const commonSpacesRelations = relations(
  commonSpaces,
  ({ one, many }) => ({
    condominium: one(condominiums, {
      fields: [commonSpaces.id],
      references: [condominiums.id],
    }),
    bookings: many(bookings),
  }),
)
