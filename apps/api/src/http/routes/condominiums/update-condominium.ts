import { condominiumSchema } from '@smart-condo/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiums } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, invalidateCache } from '@/redis'
import { getPermissions } from '@/utils/get-permissions'

export async function updateCondominiumRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .patch(
      '/condominiums/:condominiumId',
      {
        schema: {
          tags: ['condominiums'],
          summary: 'Update a condominium',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string().optional(),
            address: z.string(),
            logoUrl: z.string().optional(),
          }),
          response: {
            200: z.object({
              message: z.literal('Condominium updated successfully'),
            }),
            400: z.object({
              message: z.string(),
            }),
            401: z.object({
              message: z.union([
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

        const { cannot } = await getPermissions(userId, role)

        const authCondominium = condominiumSchema.parse({
          ...condominium,
          ownerId: condominium.ownerId,
        })

        if (cannot('update', authCondominium))
          throw new UnauthorizedError(`you're not able to perform this action`)

        const { name, description, address, logoUrl } = req.body

        await db.update(condominiums).set({
          name,
          description,
          address,
          logoUrl,
        })

        invalidateCache(CACHE_KEYS.condominium(condominiumId))
        invalidateCache(CACHE_KEYS.userCondominiums(condominium.ownerId))

        return res.status(200).send({
          message: 'Condominium updated successfully',
        })
      },
    )
}
