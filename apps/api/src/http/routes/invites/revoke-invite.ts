import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { invites } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, invalidateCache } from '@/redis'
import { getPermissions } from '@/utils/get-permissions'

export async function revokeInviteRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/condominiums/:condominiumId/invites/:inviteId/revoke',
      {
        schema: {
          tags: ['invite'],
          summary: 'Revoke invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
            inviteId: z.string().uuid(),
          }),
          response: {
            200: z.object({
              message: z.literal('Invite revoked'),
            }),
            401: z.object({
              message: z.union([
                z.literal('Invalid auth token'),
                z.literal(`you're not allowed to revoke invites`),
              ]),
            }),
            400: z.object({
              message: z.literal('invite not found or already accepted'),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()
        const { condominiumId, inviteId } = req.params
        const { condominium } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(userId, condominium.role)

        if (cannot('revoke', 'invite'))
          throw new UnauthorizedError(`you're not allowed to revoke invites`)

        const invite = await db
          .select()
          .from(invites)
          .where(
            and(
              eq(invites.id, inviteId),
              eq(invites.condominiumId, condominiumId),
            ),
          )

        if (!invite)
          throw new BadRequestError(`invite not found or already accepted`)

        await db.delete(invites).where(eq(invites.id, inviteId))
        await invalidateCache(CACHE_KEYS.invites(inviteId))

        return res.status(200).send({
          message: 'Invite revoked',
        })
      },
    )
}
