import { Notification, NotificationService } from '@smart-condo/notifications'

import { env } from '@/env'

const notificationService = new NotificationService(env.RABBITMQ_URL)

export async function sendNotification(notification: Notification) {
  await notificationService.sendNotification(notification)
}
