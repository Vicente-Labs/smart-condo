import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { commonSpaces } from '@/db/schemas'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, setCache } from '@/redis'
import { getPermissions } from '@/utils/get-permissions'

import { UnauthorizedError } from '../../_errors/unauthorized-error'

export async function registerCommonSpaceRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominiums/:condominiumId/common-spaces',
      {
        schema: {
          tags: ['common-spaces'],
          summary: 'Register a common space',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string().optional(),
            available: z.boolean(),
            capacity: z.number(),
          }),
          response: {
            201: z.object({
              message: z.literal('Common space created successfully'),
              commonSpaceId: z.string(),
            }),
            400: z.object({
              message: z.string(),
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

        const { cannot } = getPermissions(userId, condominium.role)

        if (cannot('create', 'common_spaces'))
          throw new UnauthorizedError(
            'You are not allowed to create a common space',
          )
        const { name, description, available, capacity } = req.body

        const [commonSpace] = await db
          .insert(commonSpaces)
          .values({
            name,
            description,
            available,
            capacity,
            condominiumId,
          })
          .returning()

        await setCache(
          CACHE_KEYS.commonSpace(condominiumId, commonSpace.id),
          JSON.stringify(commonSpace),
          'LONG',
        )

        return res.status(201).send({
          message: 'Common space created successfully',
          commonSpaceId: commonSpace.id,
        })
      },
    )
}
