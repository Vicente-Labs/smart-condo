import { maintenanceRequestSchema as authMaintenanceRequestSchema } from '@smart-condo/auth'
import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { maintenanceRequests } from '@/db/schemas/maintenance-requests'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'

const maintenanceRequestSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  condominiumId: z.string(),
  commonSpaceId: z.string().nullable(),
  isCommonSpace: z.boolean(),
  description: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']),
  updatedAt: z.date(),
  createdAt: z.date(),
})

export async function fetchMaintenanceRequestsRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .get(
      '/condominium/:condominiumId/maintenances',
      {
        schema: {
          tags: ['maintenance'],
          summary: 'Fetch maintenance requests',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Maintenance requests fetched successfully'),
              maintenanceRequests: maintenanceRequestSchema.array(),
            }),
            400: z.object({
              message: z.string(),
            }),
            401: z.object({
              message: z.tuple([
                z.literal('Invalid auth token'),
                z.literal('you are not a member of this condominium'),
              ]),
            }),
            500: z.object({
              message: z.literal('Internal server error'),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()
        const { condominiumId } = req.params

        const maintenanceRequest = await db
          .select()
          .from(maintenanceRequests)
          .where(eq(maintenanceRequests.condominiumId, condominiumId))

        if (!maintenanceRequest || maintenanceRequest.length <= 0)
          throw new BadRequestError('Maintenance request not found')

        const { condominium } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(userId, condominium.role)

        let authReq: z.infer<typeof authMaintenanceRequestSchema>

        const filteredMaintenanceRequests = maintenanceRequest.filter(
          (maintenanceRequest) => {
            authReq = authMaintenanceRequestSchema.parse({
              id: maintenanceRequest.id,
              authorId: maintenanceRequest.userId,
              isCondominiumResident: condominium.isCondominiumResident,
              isCommonSpace: maintenanceRequest.isCommonSpace,
            })

            if (cannot('get', authReq)) return false

            return true
          },
        )

        return res.status(200).send({
          message: 'Maintenance requests fetched successfully',
          maintenanceRequests: filteredMaintenanceRequests,
        })
      },
    )
}
