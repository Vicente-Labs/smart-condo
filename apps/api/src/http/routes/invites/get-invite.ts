import { roleSchema } from '@smart-condo/auth'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { invites } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { CACHE_KEYS, getCache, setCache } from '@/redis'

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

type Invite = z.infer<typeof inviteSchema>

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

      const cachedInvite = await getCache<Invite>(CACHE_KEYS.invites(inviteId))

      if (cachedInvite)
        return res.status(200).send({
          message: 'Invite details fetched',
          invite: cachedInvite,
        })

      const [invite] = await db
        .select()
        .from(invites)
        .where(eq(invites.id, inviteId))

      if (!invite) throw new BadRequestError(`Invite not found`)

      await setCache(CACHE_KEYS.invites(inviteId), JSON.stringify(invite))

      return res.status(200).send({
        message: 'Invite details fetched',
        invite,
      })
    },
  )
}
