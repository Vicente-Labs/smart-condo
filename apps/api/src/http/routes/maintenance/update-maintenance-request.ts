import { maintenanceRequestSchema } from '@smart-condo/auth'
import { and, eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { maintenanceRequests } from '@/db/schemas/maintenance-requests'
import { BadRequestError } from '@/http/_errors/bad-request-errors'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { getPermissions } from '@/utils/get-permissions'
import { notifications } from '@/utils/notifications-pub-sub'

export async function updateMaintenanceRequestRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/condominium/:condominiumId/maintenances/:maintenanceRequestId',
      {
        schema: {
          tags: ['maintenance'],
          summary: 'Register a maintenance request',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
            maintenanceRequestId: z.string(),
          }),
          body: z.object({
            description: z.string(),
            isCommonSpace: z.boolean(),
            commonSpaceId: z.string().optional(),
          }),
          response: {
            200: z.object({
              message: z.literal('Maintenance request successfully updated'),
            }),
            400: z.object({
              message: z.tuple([z.literal('Maintenance request not found')]),
            }),
            401: z.object({
              message: z.tuple([
                z.literal('Invalid auth token'),
                z.literal('you are not a member of this condominium'),
                z.literal(
                  'You are not allowed to update this maintenance request',
                ),
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

        const { description, isCommonSpace, commonSpaceId } = req.body

        const { cannot } = getPermissions(userId, condominium.role)

        const authMaintenanceRequest = maintenanceRequestSchema.parse({
          authorId: userId,
          id: maintenanceRequestId,
          isCondominiumResident: condominium.isCondominiumResident,
          isCommonSpace,
        })

        if (cannot('update', authMaintenanceRequest))
          throw new UnauthorizedError(
            'You are not allowed to update this maintenance request',
          )

        await db.update(maintenanceRequests).set({
          userId,
          condominiumId,
          commonSpaceId,
          isCommonSpace,
          description,
        })

        await notifications.publish({
          type: 'MAINTENANCE_REQUEST_UPDATED',
          notificationTo: 'admin',
          data: {
            userId,
            condominiumId,
            commonSpaceId,
            isCommonSpace,
            description,
          },
          channel: 'all',
        })

        return res.status(200).send({
          message: 'Maintenance request successfully updated',
        })
      },
    )
}
