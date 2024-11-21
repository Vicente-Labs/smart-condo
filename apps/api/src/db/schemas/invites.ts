import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { condominiums, users } from '.'

export const inviteStatus = pgEnum('invite_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
])

export const inviteRole = pgEnum('invite_role', ['MEMBER', 'ADMIN'])

export const invites = pgTable('invites', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  name: text('name'),
  phone: text('phone').unique(),
  email: text('email').unique(),

  inviterId: text('inviter_id')
    .references(() => users.id)
    .notNull(),
  condominiumId: text('condominium_id')
    .references(() => condominiums.id)
    .notNull(),

  role: inviteRole('role').notNull().default('MEMBER'),
  status: inviteStatus('status').notNull().default('PENDING'),

  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const inviteRelations = relations(invites, ({ one }) => ({
  inviter: one(users, {
    fields: [invites.inviterId],
    references: [users.id],
  }),
  condominium: one(condominiums, {
    fields: [invites.condominiumId],
    references: [condominiums.id],
  }),
}))
