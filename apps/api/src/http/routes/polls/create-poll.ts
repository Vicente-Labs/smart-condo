import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { polls } from '@/db/schemas/poll'
import { auth } from '@/http/middlewares/auth'

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

        const { title, description } = req.body

        const { condominiumId } = req.params

        const [poll] = await db
          .insert(polls)
          .values({
            title,
            description,
            condominiumId,
            authorId,
          })
          .returning()

        // TODO: add notification

        return res.status(201).send({
          message: 'Poll created successfully',
          pollId: poll.id,
        })
      },
    )
}
