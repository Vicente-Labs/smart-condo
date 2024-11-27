import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { invites, users } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'
import { notifications } from '@/utils/notifications-pub-sub'

export async function createInviteRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominiums/:condominiumId/invites',
      {
        schema: {
          tags: ['invites'],
          summary: 'Create invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string().uuid(),
          }),
          body: z.object({
            name: z.string(),
            email: z.string().email(),
          }),
          response: {
            201: z.object({
              message: z.literal('Invite created'),
              inviteId: z.string(),
              name: z.string(),
              email: z.string().email(),
            }),
            401: z.object({
              message: z.tuple([
                z.literal('Invalid auth token'),
                z.literal(
                  `You're not allowed to invite users to this condominium`,
                ),
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

        if (cannot('create', 'invite'))
          throw new UnauthorizedError(
            'you are not allowed to invite users to this condominium',
          )

        const { email, name } = req.body

        const [invite] = await db
          .insert(invites)
          .values({
            condominiumId,
            email: email.toLowerCase(),
            inviterId: userId,
          })
          .returning()

        const userAlreadyRegistered = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLocaleLowerCase()))

        if (userAlreadyRegistered.length > 0)
          await notifications.publish({
            type: 'INVITE_CREATED',
            notificationTo: 'user',
            userId: userAlreadyRegistered[0].id,
            data: {
              inviteId: invite.id,
              invitedBy: userId,
              email: email.toLowerCase(),
              condominiumId,
              condominiumName: condominium.name,
            },
            channel: 'email',
          })

        /* NOTE: 
        we're sending this response because the email sending will be done
        in the front-end, because we have multi-language support that is only
        handled in the front end */

        return res.status(201).send({
          message: 'Invite created',
          inviteId: invite.id,
          name,
          email: email.toLowerCase(),
        })
      },
    )
}
