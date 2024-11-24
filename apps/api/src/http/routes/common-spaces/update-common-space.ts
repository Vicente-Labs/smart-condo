import { commonSpaceSchema } from '@smart-condo/auth'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { commonSpaces, condominiumResidents } from '@/db/schemas'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { CACHE_KEYS, setCache } from '@/redis'
import { getPermissions } from '@/utils/get-permissions'

export async function updateCommonSpaceRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/common-spaces/:id',
      {
        schema: {
          tags: ['common-spaces'],
          summary: 'Update a common space',
          body: z.object({
            name: z.string(),
            description: z.string().optional(),
            available: z.boolean(),
            capacity: z.number(),
          }),
          params: z.object({
            id: z.string().uuid(),
          }),
          response: {
            200: z.object({
              message: z.literal('Common space updated successfully'),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()

        const { id } = req.params
        const { name, description, available, capacity } = req.body

        const queriedCommonSpace = await db
          .select({
            id: commonSpaces.id,
            name: commonSpaces.name,
            description: commonSpaces.description,
            available: commonSpaces.available,
            capacity: commonSpaces.capacity,
            condominiumId: commonSpaces.condominiumId,
            role: condominiumResidents.role,
          })
          .from(condominiumResidents)
          .where(eq(condominiumResidents.userId, userId))
          .leftJoin(
            commonSpaces,
            eq(commonSpaces.condominiumId, condominiumResidents.condominiumId),
          )

        if (!queriedCommonSpace || queriedCommonSpace.length <= 0)
          throw new BadRequestError('Common space not found')

        const authCommonSpace = commonSpaceSchema.parse({
          id: queriedCommonSpace[0].id,
          condominiumId: queriedCommonSpace[0].condominiumId,
          isCondominiumResident: true,
          isActive: queriedCommonSpace[0].available,
        })

        const { cannot } = getPermissions(userId, queriedCommonSpace[0].role)

        if (cannot('update', authCommonSpace))
          throw new UnauthorizedError(`You cannot update this common space`)

        const [commonSpace] = await db
          .update(commonSpaces)
          .set({ name, description, available, capacity })
          .where(eq(commonSpaces.id, id))
          .returning()

        await setCache(
          CACHE_KEYS.commonSpaces(id),
          JSON.stringify(commonSpace),
          'LONG',
        )

        return res.status(200).send({
          message: 'Common space updated successfully',
        })
      },
    )
}
