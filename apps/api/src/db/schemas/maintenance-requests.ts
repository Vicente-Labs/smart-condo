import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { commonSpaces } from './common-spaces'
import { condominiums } from './condominiums'
import { users } from './users'

export const maintenanceRequests = pgTable('maintenance_requests', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  description: text('description').notNull(),
  isCommonSpace: boolean('is_common_space').notNull().default(false),

  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  commonSpaceId: text('common_space_id').references(() => commonSpaces.id, {
    onDelete: 'cascade',
  }),

  condominiumId: text('condominium_id')
    .references(() => condominiums.id, { onDelete: 'cascade' })
    .notNull(),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const maintenanceRequestsRelations = relations(
  maintenanceRequests,
  ({ one }) => ({
    condominium: one(condominiums, {
      fields: [maintenanceRequests.id],
      references: [condominiums.id],
    }),
  }),
)
