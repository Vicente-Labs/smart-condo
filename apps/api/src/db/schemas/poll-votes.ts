import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

import { polls } from './poll'
import { pollOptions } from './poll-options'
import { users } from './users'

export const pollVotes = pgTable(
  'poll_votes',
  {
    id: text('id')
      .$defaultFn(() => createId())
      .primaryKey(),

    pollOptionId: text('poll_option_id')
      .references(() => pollOptions.id, { onDelete: 'cascade' })
      .notNull(),

    pollId: text('poll_id')
      .references(() => polls.id, { onDelete: 'cascade' })
      .notNull(),

    voterId: text('voter_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    voter_id_poll_id: unique().on(t.voterId, t.pollId),
  }),
)

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  pollOption: one(pollOptions, {
    fields: [pollVotes.pollOptionId],
    references: [pollOptions.id],
  }),
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  voter: one(users, {
    fields: [pollVotes.voterId],
    references: [users.id],
  }),
}))
