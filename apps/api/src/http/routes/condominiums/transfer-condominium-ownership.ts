import { condominiumSchema } from '@smart-condo/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiums } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'

export async function transferCondominiumOwnershipRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .patch(
      '/condominiums/:condominiumId/transfer-ownership',
      {
        schema: {
          tags: ['condominiums'],
          summary: 'Transfer a condominium ownership',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          body: z.object({
            newOwnerId: z.string(),
          }),
          response: {
            204: z.null,
            400: z.object({
              message: z.string(),
            }),
            401: z.object({
              message: z.tuple([
                z.literal('Invalid auth token'),
                z.literal('You are not able to perform this action'),
              ]),
            }),
            500: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()
        const { condominiumId } = req.params
        const {
          condominium: { role, ...condominium },
        } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(userId, role)

        const authCondominium = condominiumSchema.parse({
          ...condominium,
          ownerId: condominium.ownerId,
        })

        if (cannot('transfer_ownership', authCondominium))
          throw new UnauthorizedError(`you're not able to perform this action`)

        const { newOwnerId } = req.body

        await db.update(condominiums).set({
          ownerId: newOwnerId,
        })

        return res.status(204).send()
      },
    )
}