import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { users } from '@/db/schemas'

import { BadRequestError } from '../../_errors/bad-request-errors'

export async function registerAccountRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a new user using email and password',
        body: z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().email('Invalid email'),
          phone: z.string().min(11, 'Phone is required'),
          password: z.string().min(8, 'Password is required'),
        }),
        response: {
          204: z.null(),
          400: z.object({
            message: z.literal('User with same e-mail already exists.'),
          }),
          500: z.object({
            message: z.tuple([z.literal('Internal server error.'), z.string()]),
          }),
        },
      },
    },
    async (req, res) => {
      const { name, email, phone, password } = req.body

      const [userWithSameEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))

      if (userWithSameEmail)
        throw new BadRequestError('User with same e-mail already exists.')

      const passwordHash = await hash(password, 8)

      await db.insert(users).values({
        name,
        email,
        phone,
        passwordHash,
      })

      return res.status(204).send()
    },
  )
}
