import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { notifications } from '@/utils/notifications-pub-sub'

export async function notificationsWs(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/notifications/:userId',
    {
      schema: {
        tags: ['notifications'],
        summary: 'Subscribe to notifications',
        params: z.object({
          userId: z.string(),
        }),
      },
      websocket: true,
    },
    (connection, req) => {
      const { userId } = req.params

      connection.send('connected')

      notifications.subscribe(userId, (notification) => {
        console.log('Sending notification to', userId)

        connection.send(JSON.stringify(notification))
      })

      notifications.subscribeForAll((notification) => {
        console.log('Sending notification to all', userId)

        connection.send(JSON.stringify(notification))
      })
    },
  )
}
