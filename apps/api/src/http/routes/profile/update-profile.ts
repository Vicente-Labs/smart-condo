import { and, eq, not } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { users } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, setCache } from '@/redis'

export async function updateProfileRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/profile',
      {
        schema: {
          tags: ['profile'],
          summary: 'Update user profile',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string().min(2).max(100),
            email: z.string().email(),
            phone: z.string().min(11).max(11),
            bio: z.string().optional(),
            avatarUrl: z.string().optional(),
          }),
          response: {
            200: z.object({
              message: z.literal('Profile updated successfully'),
            }),
            400: z.object({
              message: z.enum(['Email already in use', 'Validation error']),
              errors: z
                .object({
                  name: z.array(z.string()).optional(),
                  email: z.array(z.string()).optional(),
                  phone: z.array(z.string()).optional(),
                  bio: z.array(z.string()).optional(),
                  avatarUrl: z.array(z.string()).optional(),
                })
                .optional(),
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
        const { sub: userId } = await req.getCurrentUserId()

        const { name, email, phone, bio, avatarUrl } = req.body

        const existingUser = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), not(eq(users.id, userId))))

        if (existingUser) throw new BadRequestError('Email already in use')

        const [user] = await db
          .update(users)
          .set({ name, email, phone, bio, avatarUrl })
          .where(eq(users.id, userId))
          .returning()

        await setCache(CACHE_KEYS.profile(userId), JSON.stringify(user))

        return res.status(200).send({
          message: 'Profile updated successfully',
        })
      },
    )
}
