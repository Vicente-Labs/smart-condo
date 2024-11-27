import { Notification, NotificationService } from '@smart-condo/notifications'

import { env } from '@/env'

const notificationService = new NotificationService(
  env.SQS_REGION,
  env.SQS_QUEUE_URL,
  env.AWS_ACCESS_KEY_ID,
  env.AWS_SECRET_ACCESS_KEY,
)

export async function sendNotification(notification: Notification) {
  await notificationService.send_message(notification)
}
