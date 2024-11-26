import { roleSchema } from '@smart-condo/auth'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { invites } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'

const inviteSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
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

export async function getInviteRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/invites/:inviteId',
    {
      schema: {
        tags: ['invite'],
        summary: 'Get invite details',
        params: z.object({
          inviteId: z.string(),
        }),
        response: {
          200: z.object({
            message: z.literal('Invite details fetched'),
            invite: inviteSchema,
          }),
          400: z.object({
            message: z.literal('invite not found'),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (req, res) => {
      const { inviteId } = req.params

      const [invite] = await db
        .select()
        .from(invites)
        .where(eq(invites.id, inviteId))

      if (!invite) throw new BadRequestError(`Invite not found`)

      return res.status(200).send({
        message: 'Invite details fetched',
        invite,
      })
    },
  )
}
