import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import {
  condominiumResidents,
  condominiums,
  invites,
  users,
} from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { sendNotification } from '@/notifications'

export async function acceptInviteRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/invites/:inviteId/accept',
      {
        schema: {
          tags: ['invite'],
          summary: 'Accept invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            inviteId: z.string().uuid(),
          }),
          response: {
            201: z.object({
              message: z.literal('Invite accepted'),
              condominiumId: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()
        const { inviteId } = req.params

        const [invite] = await db
          .select()
          .from(invites)
          .where(eq(invites.id, inviteId))

        if (!invite) throw new BadRequestError('invite not found or expired')

        const condominium = await db
          .select()
          .from(condominiums)
          .where(eq(condominiums.id, invite.condominiumId))

        if (!condominium || condominium.length === 0)
          throw new BadRequestError('condominium not found')

        const [user] = await db.select().from(users).where(eq(users.id, userId))

        if (!user) throw new BadRequestError(`User not found`)

        if (invite.email !== user.email)
          throw new BadRequestError('this invite belongs to another user')

        await db.transaction(async (tx) => {
          await tx.insert(condominiumResidents).values({
            userId,
            condominiumId: invite.condominiumId,
            role: invite.role,
          })

          await tx.delete(invites).where(eq(invites.id, inviteId))
        })

        await sendNotification({
          type: 'INVITE_ACCEPTED',
          notificationTo: 'USER',
          data: {
            inviteId,
            condominiumId: invite.condominiumId,
            condominiumName: condominium[0].name,
            residentName: invite.name,
          },
          channel: 'email',
          userId,
        })

        return res.status(201).send({
          message: 'Invite accepted',
          condominiumId: invite.condominiumId,
        })
      },
    )
}
