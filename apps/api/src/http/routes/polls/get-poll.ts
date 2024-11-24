import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiumResidents } from '@/db/schemas'
import { polls } from '@/db/schemas/poll'
import { pollOptions } from '@/db/schemas/poll-options'
import { pollVotes } from '@/db/schemas/poll-votes'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, getCache, setCache } from '@/redis'

const pollOptionsSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  votes: z.number(),
})

const pollSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  condominiumId: z.string(),
  authorId: z.string().nullable(),
  options: pollOptionsSchema.array(),
})

type Poll = z.infer<typeof pollSchema>

export async function getPollRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/condominium/:condominiumId/polls/:pollId',
      {
        schema: {
          tags: ['polls'],
          summary: 'Get a poll',
          security: [{ bearerAuth: [] }],
          params: z.object({
            pollId: z.string(),
            condominiumId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Poll fetched successfully'),
              poll: pollSchema,
            }),
            400: z.object({
              message: z.string(),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()

        const { pollId, condominiumId } = req.params

        const cachedPoll = await getCache<Poll>(CACHE_KEYS.poll(pollId))

        if (cachedPoll)
          return res
            .status(200)
            .send({ message: 'Poll fetched successfully', poll: cachedPoll })

        const poll = await db
          .select({
            id: polls.id,
            title: polls.title,
            description: polls.description,
            createdAt: polls.createdAt,
            condominiumId: polls.condominiumId,
            authorId: polls.authorId,
          })
          .from(condominiumResidents)
          .where(
            and(
              eq(condominiumResidents.userId, userId),
              eq(condominiumResidents.condominiumId, condominiumId),
            ),
          )
          .leftJoin(
            polls,
            and(
              eq(polls.condominiumId, condominiumResidents.condominiumId),
              eq(polls.id, pollId),
            ),
          )

        const options = await db
          .select()
          .from(pollOptions)
          .where(eq(pollOptions.pollId, pollId))

        const votes = await db
          .select()
          .from(pollVotes)
          .where(eq(pollVotes.pollId, pollId))

        const formattedOptions = options.map((op) => ({
          ...op,
          votes: votes.filter((v) => v.pollOptionId === op.id).length,
        }))

        if (
          !poll ||
          !poll[0].id ||
          !poll[0].title ||
          !poll[0].createdAt ||
          !poll[0].condominiumId
        )
          throw new BadRequestError('Poll not found')

        const formattedPoll = {
          id: poll[0].id,
          title: poll[0].title,
          description: poll[0].description,
          createdAt: poll[0].createdAt,
          condominiumId: poll[0].condominiumId,
          authorId: poll[0].authorId,
          options: formattedOptions,
        }

        await setCache(
          CACHE_KEYS.poll(pollId),
          JSON.stringify(formattedPoll),
          'SHORT',
        )

        return res.status(200).send({
          message: 'Poll fetched successfully',
          poll: formattedPoll,
        })
      },
    )
}
