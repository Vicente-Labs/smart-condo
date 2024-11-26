import * as amqp from 'amqplib'

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
  notificationTo: 'ALL' | 'USER' | 'ADMIN'
  channel: 'email' | 'push' | 'both'
  userId?: string | null
  data: unknown
}

export class NotificationService {
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private readonly exchangeName = 'notifications'
  private readonly queueName = 'notifications_queue'

  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly url: string) {}

  async connect() {
    if (this.connection && this.channel) return

    try {
      console.log('Connecting to RabbitMQ...')
      this.connection = await amqp.connect(this.url)
      this.channel = await this.connection.createChannel()

      await this.channel.assertExchange(this.exchangeName, 'direct', {
        durable: true,
      })
      await this.channel.assertQueue(this.queueName, { durable: true })

      await this.channel.bindQueue(this.queueName, this.exchangeName, 'user')
      await this.channel.bindQueue(this.queueName, this.exchangeName, 'admin')
      await this.channel.bindQueue(this.queueName, this.exchangeName, 'all')

      console.log('Connected to RabbitMQ successfully.')
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error)
      throw error
    }
  }

  async ensureConnection() {
    if (!this.connection || !this.channel) {
      console.warn('Reconnecting to RabbitMQ...')
      await this.connect()
    }
  }

  private async publishNotification(
    notification: Notification,
    routingKey: string,
  ) {
    this.channel?.publish(
      this.exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(notification)),
      {
        persistent: true,
        messageId: notification.type,
      },
    )
    console.log('Notification sent successfully:', {
      routingKey,
      notification,
    })
  }

  async sendNotification(notification: Notification, retries = 3) {
    await this.ensureConnection()

    const baseRoutingKey = notification.notificationTo.toLowerCase()

    const routingKeys =
      notification.channel === 'both'
        ? [`${baseRoutingKey}.email`, `${baseRoutingKey}.push`]
        : [`${baseRoutingKey}.${notification.channel}`]

    for (const routingKey of routingKeys) {
      let attempt = 0

      while (attempt < retries) {
        try {
          await this.publishNotification(notification, routingKey)
          break
        } catch (error) {
          attempt++
          console.error(
            `Error sending notification via ${routingKey}, attempt ${attempt}:`,
            error,
          )
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } else {
            console.error(
              `Failed to send notification after ${retries} retries via ${routingKey}:`,
              notification,
            )
          }
        }
      }
    }
  }

  async close() {
    try {
      await this.channel?.close()
      await this.connection?.close()
      console.log('RabbitMQ connection closed.')
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error)
    }
  }
}
