import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

import { condominiums, users } from '.'

export const condominiumRole = pgEnum('condominium_role', ['ADMIN', 'MEMBER'])

export const condominiumResidents = pgTable('condominium_residents', {
  userId: text('user_id').references(() => users.id),
  condominiumId: text('condominium_id').references(() => condominiums.id),

  role: condominiumRole('role').notNull().default('MEMBER'),
})

export const condominiumResidentsRelations = relations(
  condominiumResidents,
  ({ one }) => ({
    condominium: one(condominiums, {
      fields: [condominiumResidents.condominiumId],
      references: [condominiums.id],
    }),
  }),
)
