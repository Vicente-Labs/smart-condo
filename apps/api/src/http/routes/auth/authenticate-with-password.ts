import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as jose from 'jose'
import { z } from 'zod'

import { db } from '@/db'
import { users } from '@/db/schemas'
import { env } from '@/env'

import { BadRequestError } from '../../_errors/bad-request-errors'

export async function authenticateWithPasswordRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with email and password',
        body: z.object({
          email: z.string().email('Invalid email'),
          password: z.string().min(8, 'Password is required'),
        }),
        response: {
          200: z.object({
            token: z.string(),
          }),
          400: z.object({
            message: z.literal('Invalid credentials.'),
          }),
          500: z.object({
            message: z.tuple([z.literal('Internal server error.'), z.string()]),
          }),
        },
      },
    },
    async (req, res) => {
      const { email, password } = req.body

      const [user] = await db.select().from(users).where(eq(users.email, email))

      if (!user) throw new BadRequestError('Invalid credentials.')

      const isPasswordValid = await compare(password, user.passwordHash)

      if (!isPasswordValid) throw new BadRequestError('Invalid credentials.')

      const secret = new TextEncoder().encode(env.JWT_SECRET)

      const token = await new jose.SignJWT({ sub: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret)

      return res.status(200).send({ token })
    },
  )
}
