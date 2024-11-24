import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { commonSpaces, condominiumResidents } from '@/db/schemas'
import { CACHE_KEYS, setCache } from '@/redis'

import { auth } from '../../middlewares/auth'

export async function fetchCommonSpacesRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/condominiums/:condominiumId/common-spaces',
      {
        schema: {
          tags: ['common-spaces'],
          summary: 'Fetch common spaces',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.string(),
              commonSpaces: z
                .object({
                  id: z.string(),
                  name: z.string(),
                  description: z.string().nullable(),
                  available: z.boolean(),
                  capacity: z.number(),
                  createdAt: z.coerce.date(),
                  updatedAt: z.coerce.date(),
                })
                .array(),
              condominiumId: z.string(),
              isCondominiumResident: z.boolean(),
            }),
            401: z.object({
              message: z.literal('Invalid auth token.'),
            }),
            404: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        await req.getCurrentUserId()

        const { condominiumId } = req.params

        await req.getUserMembership(condominiumId)

        const queriedCommonSpaces = await db
          .select({
            id: commonSpaces.id,
            name: commonSpaces.name,
            description: commonSpaces.description,
            available: commonSpaces.available,
            capacity: commonSpaces.capacity,
            createdAt: commonSpaces.createdAt,
            updatedAt: commonSpaces.updatedAt,
          })
          .from(condominiumResidents)
          .where(eq(condominiumResidents.condominiumId, condominiumId))
          .leftJoin(
            commonSpaces,
            eq(condominiumResidents.condominiumId, commonSpaces.condominiumId),
          )

        const availableCommonSpaces = queriedCommonSpaces.filter(
          (c) => c.available,
        )

        const formattedCommonSpaces = availableCommonSpaces.map((c) => {
          if (
            !c.id ||
            !c.name ||
            !c.available ||
            !c.capacity ||
            !c.createdAt ||
            !c.updatedAt
          )
            throw new Error('Invalid common space data')

          return {
            id: c.id,
            name: c.name,
            description: c.description,
            available: c.available,
            capacity: c.capacity,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }
        })

        await setCache(
          CACHE_KEYS.commonSpaces(condominiumId),
          JSON.stringify(formattedCommonSpaces),
          'LONG',
        )

        return res.status(200).send({
          message: 'Common spaces fetched successfully',
          condominiumId,
          isCondominiumResident: true,
          commonSpaces: formattedCommonSpaces,
        })
      },
    )
}
