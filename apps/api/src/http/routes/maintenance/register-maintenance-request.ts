import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { db } from '@/db'
import { maintenanceRequests } from '@/db/schemas/maintenance-requests'
import { auth } from '@/http/middlewares/auth'
import { sendNotification } from '@/notifications'

export async function registerMaintenanceRequestRoute(app: FastifyInstance) {
  app
    .register(auth)
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/condominium/:condominiumId/maintenances',
      {
        schema: {
          tags: ['maintenance'],
          summary: 'Register a maintenance request',
          security: [{ bearerAuth: [] }],
          params: z.object({
            condominiumId: z.string(),
          }),
          body: z.object({
            description: z.string(),
            isCommonSpace: z.boolean(),
            commonSpaceId: z.string().optional(),
          }),
          response: {
            200: z.object({
              message: z.literal('Maintenance request registered successfully'),
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

        await req.getUserMembership(condominiumId)

        const { description, isCommonSpace, commonSpaceId } = req.body

        await db.insert(maintenanceRequests).values({
          userId,
          condominiumId,
          commonSpaceId,
          isCommonSpace,
          description,
        })

        await sendNotification({
          type: 'MAINTENANCE_REQUEST_CREATED',
          notificationTo: 'ADMIN',
          data: {
            userId,
            condominiumId,
            commonSpaceId,
            isCommonSpace,
            description,
          },
          channel: 'both',
        })

        return res.status(200).send({
          message: 'Maintenance request registered successfully',
        })
      },
    )
}
