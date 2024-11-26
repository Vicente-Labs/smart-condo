import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { maintenanceRequests } from '@/db/schemas/maintenance-requests'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'
import { maintenanceRequestSchema } from '~/packages/auth/src/models/maintenance-request'

export async function deleteMaintenanceRequestRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/condominium/:condominiumId/maintenance-request/:maintenanceRequestId',
      {
        schema: {
          tags: ['maintenance'],
          summary: 'Delete a maintenance request',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
            maintenanceRequestId: z.string(),
          }),
          response: {
            200: z.object({
              message: z.literal('Maintenance request deleted successfully'),
            }),
            401: z.object({
              message: z.literal('invalid auth token'),
            }),
            400: z.object({
              message: z.literal('Maintenance request not found'),
            }),
          },
        },
      },
      async (req, res) => {
        const { sub: userId } = await req.getCurrentUserId()
        const { condominiumId, maintenanceRequestId } = req.params

        const maintenanceRequest = await db
          .select()
          .from(maintenanceRequests)
          .where(
            and(
              eq(maintenanceRequests.id, maintenanceRequestId),
              eq(maintenanceRequests.condominiumId, condominiumId),
            ),
          )

        if (!maintenanceRequest || maintenanceRequest.length <= 0)
          throw new BadRequestError('Maintenance request not found')

        const { condominium } = await req.getUserMembership(condominiumId)

        const { cannot } = getPermissions(userId, condominium.role)

        const authMaintenanceRequest = maintenanceRequestSchema.parse({
          authorId: userId,
          id: maintenanceRequestId,
          isCondominiumResident: condominium.isCondominiumResident,
          isCommonSpace: !!maintenanceRequest[0].isCommonSpace,
        })

        if (cannot('delete', authMaintenanceRequest))
          throw new UnauthorizedError(
            'You are not allowed to delete this maintenance request',
          )

        await db
          .update(maintenanceRequests)
          .set({
            status: 'CANCELED',
          })
          .where(eq(maintenanceRequests.id, maintenanceRequestId))

        return res.status(200).send({
          message: 'Maintenance request deleted successfully',
        })
      },
    )
}
