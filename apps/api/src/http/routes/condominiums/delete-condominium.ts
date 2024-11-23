import { condominiumSchema } from '@smart-condo/auth'
import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { condominiums } from '@/db/schemas'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'

export async function deleteCondominiumRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .delete(
      '/condominiums/:condominiumId',
      {
        schema: {
          tags: ['condominiums'],
          summary: 'Delete a condominium',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          response: {
            204: z.null(),
            400: z.object({
              message: z.literal(
                'Condominium with this address already exists',
              ),
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
        const { sub: ownerId } = await req.getCurrentUserId()
        const { condominiumId } = req.params

        const {
          condominium: { role, ...condominium },
        } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(ownerId, role)

        const authCondominium = condominiumSchema.parse({
          ...condominium,
          ownerId: condominium.ownerId,
        })

        if (cannot('delete', authCondominium))
          throw new UnauthorizedError(`you're not able to perform this action`)

        await db.delete(condominiums).where(eq(condominiums.id, condominiumId))

        return res.status(204).send()
      },
    )
}
