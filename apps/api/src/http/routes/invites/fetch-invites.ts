import { roleSchema } from '@smart-condo/auth'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { invites } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, getCache, setCache } from '@/redis'
import { getPermissions } from '@/utils/get-permissions'

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

export async function fetchInvitesRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/condominiums/:condominiumId/invites',
      {
        schema: {
          tags: ['invite'],
          summary: 'Fetch invites',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Invites fetched'),
              invites: z.array(inviteSchema),
            }),
            401: z.object({
              message: z.tuple([
                z.literal('Invalid auth token'),
                z.literal(`You're not allowed to get group invites`),
              ]),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { condominiumId } = req.params
        const { sub: userId } = await req.getCurrentUserId()
        const { condominium } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(userId, condominium.role)

        if (cannot('get', 'invite'))
          throw new UnauthorizedError(`You're not allowed to get group invites`)

        const cachedInvites = await getCache<Invite[]>(
          CACHE_KEYS.invites(condominiumId),
        )

        if (cachedInvites)
          return res.status(200).send({
            message: 'Invites fetched',
            invites: cachedInvites,
          })

        const queriedInvites = await db
          .select()
          .from(invites)
          .where(eq(invites.condominiumId, condominiumId))

        await setCache(
          CACHE_KEYS.invites(condominiumId),
          JSON.stringify(queriedInvites),
        )

        return res.status(200).send({
          message: 'Invites fetched',
          invites: queriedInvites,
        })
      },
    )
}
