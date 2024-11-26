import { pollSchema } from '@smart-condo/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { polls } from '@/db/schemas/poll'
import { pollOptions } from '@/db/schemas/poll-options'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'

export async function createPollRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominium/:condominiumId/polls',
      {
        schema: {
          tags: ['polls'],
          summary: 'Create a poll',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          body: z.object({
            title: z.string(),
            description: z.string(),
            options: z
              .object({
                label: z.string(),
                description: z.string().nullable(),
              })
              .array(),
          }),
          response: {
            201: z.object({
              message: z.literal('Poll created successfully'),
              pollId: z.string(),
            }),
            400: z.object({
              message: z.string(),
            }),
            401: z.object({
              message: z.literal('Invalid auth token'),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: authorId } = await req.getCurrentUserId()

        const { title, description, options } = req.body

        const { condominiumId } = req.params

        const { condominium } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(authorId, condominium.role)

        const authPoll = pollSchema.parse({
          __typename: 'poll',
          id: condominiumId, // fake id cuz we don't have one yet
          role: condominium.role,
        })

        if (cannot('create', authPoll))
          throw new UnauthorizedError(`You're not allowed to create polls`)

        const [poll] = await db.transaction(async (tx) => {
          const poll = await tx
            .insert(polls)
            .values({
              title,
              description,
              condominiumId,
              authorId,
            })
            .returning()

          await Promise.all(
            options.map(async (op) => {
              await tx.insert(pollOptions).values({
                ...op,
                pollId: poll[0].id,
              })
            }),
          )

          return poll
        })

        // TODO: add notification

        return res.status(201).send({
          message: 'Poll created successfully',
          pollId: poll.id,
        })
      },
    )
}
