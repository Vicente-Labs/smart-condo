import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiumResidents } from '@/db/schemas'
import { polls } from '@/db/schemas/poll'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, getCache, setCache } from '@/redis'

const pollSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  createdAt: z.coerce.date(),
  condominiumId: z.string(),
  authorId: z.string().nullish(),
})

export async function getPollRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/polls/:pollId',
      {
        schema: {
          tags: ['polls'],
          summary: 'Get a poll',
          security: [{ bearerAuth: [] }],
          params: z.object({
            pollId: z.string(),
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

        const { pollId } = req.params

        const cachedPoll = await getCache<typeof polls.$inferSelect>(
          CACHE_KEYS.poll(pollId),
        )

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
          .where(eq(condominiumResidents.userId, userId))
          .leftJoin(
            polls,
            and(
              eq(polls.condominiumId, condominiumResidents.condominiumId),
              eq(polls.id, pollId),
            ),
          )

        if (!poll || poll.length <= 0)
          throw new BadRequestError('Poll not found')

        const formattedPoll = pollSchema.parse(poll[0])

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
