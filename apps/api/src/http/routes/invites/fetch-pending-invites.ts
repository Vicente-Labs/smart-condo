import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { invites, users } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { roleSchema } from '~/packages/auth/src'

const invitesSchema = z.object({
  status: z.literal('PENDING'),
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  inviterId: z.string(),
  condominiumId: z.string(),
  role: roleSchema,
})

export async function getPendingInvitesRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/pending-invites',
      {
        schema: {
          tags: ['invite'],
          summary: 'Get pending invites',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              message: z.literal('Pending invites fetched'),
              invites: z.array(invitesSchema),
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

        const [user] = await db.select().from(users).where(eq(users.id, userId))

        if (!user) throw new BadRequestError(`user not found`)

        const pendingInvites = await db
          .select()
          .from(invites)
          .where(
            and(eq(invites.status, 'PENDING'), eq(invites.email, user.email)),
          )

        return res.status(200).send({
          message: 'Pending invites fetched',
          invites: pendingInvites.map((inv) => ({
            ...inv,
            status: 'PENDING', // forcing type safety, cuz we already filtered
          })),
        })
      },
    )
}
