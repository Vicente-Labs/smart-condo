import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { users } from '@/db/schemas'
import { auth } from '@/http/middlewares/auth'

import { BadRequestError } from '../../_errors/bad-request-errors'

export async function getProfileRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/me',
      {
        schema: {
          tags: ['profile'],
          summary: 'Get own profile',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              user: z.object({
                id: z.string(),
                name: z.string(),
                email: z.string(),
                phone: z.string(),
                avatarUrl: z.string().nullable(),
                updatedAt: z.coerce.date(),
                createdAt: z.coerce.date(),
              }),
            }),
            400: z.object({
              message: z.literal('User not found.'),
            }),
            500: z.object({
              message: z.tuple([
                z.literal('Internal server error.'),
                z.string(),
              ]),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()

        const user = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            avatarUrl: users.avatarUrl,
            updatedAt: users.updatedAt,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))

        if (!user || user.length <= 0)
          throw new BadRequestError('User not found.')

        return res.status(200).send({ user: user[0] })
      },
    )
}
