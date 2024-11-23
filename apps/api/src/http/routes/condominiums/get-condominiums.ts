import { condominiumSchema } from '@smart-condo/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found-error'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'

export async function getCondominiumRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/condominiums/:condominiumId',
      {
        schema: {
          tags: ['condominiums'],
          summary: 'Fetch a condominium',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Condominium successfully fetched'),
              condominium: z.object({
                id: z.string(),
                name: z.string(),
                logoUrl: z.string().nullable(),
                address: z.string(),
                description: z.string().nullable(),
                updatedAt: z.coerce.date(),
                createdAt: z.coerce.date(),
              }),
            }),
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
        const { sub: userId } = await req.getCurrentUserId()

        const { condominiumId } = req.params

        const { condominium } = await req.getUserMembership(condominiumId)

        if (!condominium) throw new NotFoundError('Condominium not found')

        const authCondominium = condominiumSchema.parse({
          ...condominium,
          isOwner: condominium.ownerId === userId,
        })

        const { cannot } = getPermissions(userId, condominium.role)

        if (cannot('get', authCondominium))
          throw new UnauthorizedError(
            'You are not allowed to access this condominium',
          )

        return res.status(200).send({
          message: 'Condominium successfully fetched',
          condominium,
        })
      },
    )
}
