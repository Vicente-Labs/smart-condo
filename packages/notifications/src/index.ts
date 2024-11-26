import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

type CommonSpaceBookedNotificationsType =
  | 'COMMON_SPACE_BOOKED'
  | 'COMMON_SPACE_CREATED'
  | 'COMMON_SPACE_UNAVAILABLE'

type PollNotificationsType = 'POLL_CREATED' | 'POLL_VOTED'

type BookingNotificationsType = 'BOOKING_REVOKED'

type InviteNotificationsType = 'INVITE_CREATED' | 'INVITE_ACCEPTED'

type MaintenanceRequestNotificationsType = 'MAINTENANCE_REQUEST'

export interface Notification {
  type:
    | CommonSpaceBookedNotificationsType
    | PollNotificationsType
    | BookingNotificationsType
    | InviteNotificationsType
    | MaintenanceRequestNotificationsType
  notificationTo: 'ALL' | 'USER' | 'ADMIN'
  userId?: string | null
  data: unknown
}

export class NotificationService {
  private sqs: SQSClient
  private queueUrl: string

  constructor(
    region: string,
    queueUrl: string,
    AWS_ACCESS_KEY_ID: string,
    AWS_SECRET_ACCESS_KEY: string,
    AWS_ACCOUNT_ID: string,
  ) {
    this.sqs = new SQSClient({
      region,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        accountId: AWS_ACCOUNT_ID,
      },
    })
    this.queueUrl = queueUrl
  }

  async sendNotification(notification: Notification) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(notification),
      MessageGroupId: notification.type,
      MessageDeduplicationId: notification.type,
    })

    try {
      await this.sqs.send(command)
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }
}
