import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'

import { polls } from './poll'
import { pollVotes } from './poll-votes'

export const pollOptions = pgTable('poll_options', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),

  pollId: text('poll_id')
    .references(() => polls.id)
    .notNull(),

  label: text('label').notNull(),
  description: text('description'),
})

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}))
