import { and, eq, not } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { users } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, invalidateCache } from '@/redis'

export async function updateProfileRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/profile',
      {
        schema: {
          body: z.object({
            name: z.string().min(2).max(100),
            email: z.string().email(),
            phone: z.string(),
            bio: z.string().optional(),
            avatarUrl: z.string().optional(),
          }),
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

        await db
          .update(users)
          .set({ name, email, phone, bio, avatarUrl })
          .where(eq(users.id, userId))

        await invalidateCache(CACHE_KEYS.profile(userId))

        return res.status(204).send()
      },
    )
}