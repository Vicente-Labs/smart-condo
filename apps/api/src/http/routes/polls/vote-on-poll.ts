import { pollSchema as authPollSchema } from '@smart-condo/auth'
import { and, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiumResidents } from '@/db/schemas'
import { polls } from '@/db/schemas/poll'
import { pollOptions } from '@/db/schemas/poll-options'
import { pollVotes } from '@/db/schemas/poll-votes'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { sendNotification } from '@/notifications'
import { CACHE_KEYS, invalidateCache, redisClient } from '@/redis'
import { getPermissions } from '@/utils/get-permissions'
import { notifications } from '@/utils/notifications-pub-sub'
import { voting } from '@/utils/voting-pub-sub'

export async function voteOnPollRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominium/:condominiumId/polls/:pollId/vote',
      {
        schema: {
          tags: ['polls'],
          summary: 'Vote on a poll',
          security: [{ bearerAuth: [] }],
          body: z.object({
            optionId: z.string(),
          }),
          params: z.object({
            condominiumId: z.string(),
            pollId: z.string(),
          }),
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()

        const { pollId, condominiumId } = req.params
        const { optionId } = req.body

        const { condominium } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(userId, condominium.role)

        const authPoll = authPollSchema.parse({
          __typename: 'poll',
          id: pollId,
          role: condominium.role,
          isCondominiumResident: true,
        })

        if (cannot('vote', authPoll))
          throw new UnauthorizedError(
            'You are not allowed to vote on this poll',
          )

        const poll = await db
          .select({
            pollId: polls.id,
            condominiumId: polls.condominiumId,
            pollOptions: sql<{ id: string; label: string }[]>`json_agg(
              json_build_object(
                'id', ${pollOptions.id},
                'label', ${pollOptions.label}
              )
            )`,
          })
          .from(condominiumResidents)
          .where(
            and(
              eq(condominiumResidents.userId, userId),
              eq(condominiumResidents.condominiumId, condominiumId),
            ),
          )
          .leftJoin(polls, eq(polls.id, pollId))
          .leftJoin(pollOptions, eq(pollOptions.pollId, pollId))
          .groupBy(polls.id, polls.condominiumId)

        if (!poll || poll.length <= 0)
          throw new BadRequestError('Poll not found')

        const alreadyVoted = await db
          .select()
          .from(pollVotes)
          .where(
            and(eq(pollVotes.voterId, userId), eq(pollVotes.pollId, pollId)),
          )

        if (alreadyVoted.length > 0) {
          throw new BadRequestError('You already voted on this poll')
        }

        await db.insert(pollVotes).values({
          pollId,
          pollOptionId: optionId,
          voterId: userId,
        })

        const votesCount = redisClient.zincrby(pollId, 1, optionId)

        voting.publish(pollId, {
          optionId,
          votes: Number(votesCount),
        })

        invalidateCache(CACHE_KEYS.poll(pollId))

        await notifications.publish({
          type: 'POLL_VOTED',
          notificationTo: 'user',
          userId,
          data: {
            pollId,
            choice: optionId,
          },
          channel: 'email',
        })

        return res.status(201).send({
          message: 'Vote registered successfully',
        })
      },
    )
}
