import { Notification, NotificationService } from '@smart-condo/notifications'

import { env } from '@/env'

const notificationService = new NotificationService(
  env.SQS_REGION,
  env.SQS_QUEUE_URL,
  env.AWS_ACCESS_KEY_ID,
  env.AWS_SECRET_ACCESS_KEY,
  env.AWS_ACCOUNT_ID,
)

export async function sendNotification(notification: Notification) {
  console.log('Sending notification with the following details:', notification)
  await notificationService.sendNotification(notification)
}
