import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { condominiums } from './condominiums'
import { pollOptions } from './poll-options'
import { pollVotes } from './poll-votes'
import { users } from './users'

export const polls = pgTable('polls', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  title: text('title').notNull(),
  description: text('description').notNull(),

  condominiumId: text('condominium_id')
    .references(() => condominiums.id, { onDelete: 'cascade' })
    .notNull(),

  authorId: text('author_id').references(() => users.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const pollsRelations = relations(polls, ({ many }) => ({
  options: many(pollOptions),
  votes: many(pollVotes),
}))
