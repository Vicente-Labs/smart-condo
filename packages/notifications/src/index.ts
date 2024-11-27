import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

type CommonSpaceBookedNotificationsType =
  | 'COMMON_SPACE_BOOKED'
  | 'COMMON_SPACE_CREATED'
  | 'COMMON_SPACE_UNAVAILABLE'

type PollNotificationsType = 'POLL_CREATED' | 'POLL_VOTED'

type BookingNotificationsType = 'BOOKING_REVOKED'

type InviteNotificationsType = 'INVITE_CREATED' | 'INVITE_ACCEPTED'

type MaintenanceRequestNotificationsType =
  | 'MAINTENANCE_REQUEST_CREATED'
  | 'MAINTENANCE_REQUEST_UPDATED'

export interface Notification {
  type:
    | CommonSpaceBookedNotificationsType
    | PollNotificationsType
    | BookingNotificationsType
    | InviteNotificationsType
    | MaintenanceRequestNotificationsType
  notificationTo: 'all' | 'user' | 'admin'
  channel: 'email' | 'push' | 'web' | 'all'
  userId?: string | null
  data: unknown
}

export class NotificationService {
  private sqs: SQSClient
  private readonly queueUrl: string

  constructor(
    region: string,
    queueUrl: string,
    AWS_ACCESS_KEY_ID: string,
    AWS_SECRET_ACCESS_KEY: string,
  ) {
    this.sqs = new SQSClient({
      region,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    })
    this.queueUrl = queueUrl
  }

  private async sendMessage(notification: Notification) {
    if (!this.queueUrl) {
      throw new Error(`No queue URL found`)
    }

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(notification),
      MessageGroupId: notification.type,
      MessageDeduplicationId: notification.type,
      MessageAttributes: {
        notificationTo: {
          DataType: 'String',
          StringValue: notification.notificationTo,
        },
        type: {
          DataType: 'String',
          StringValue: notification.type,
        },
      },
    })

    await this.sqs.send(command)
  }

  async send_message(notification: Notification, retries = 3) {
    let attempt = 0

    while (attempt < retries) {
      try {
        await this.sendMessage(notification)
        break
      } catch (error) {
        attempt++
        console.error(`Error sending notification, attempt ${attempt}:`, error)
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } else {
          console.error(
            `Failed to send notification after ${retries} retries:`,
            notification,
          )
        }
      }
    }
  }
}
