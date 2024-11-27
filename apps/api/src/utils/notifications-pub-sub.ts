import { Notification } from '@smart-condo/notifications'

import { sendNotification } from '@/notifications'

type Subscriber = (notification: Notification) => void

export class NotificationsPubSub {
  private channels: Record<string, Subscriber[]> = {}

  subscribeForAll(subscriber: Subscriber) {
    if (!this.channels['*']) {
      this.channels['*'] = []
    }
    this.channels['*'].push(subscriber)
    return () => {
      this.channels['*'] = this.channels['*'].filter(
        (sub) => sub !== subscriber,
      )
    }
  }

  subscribeForAdmin(subscriber: Subscriber) {
    if (!this.channels.admin) {
      this.channels.admin = []
    }
    this.channels.admin.push(subscriber)
    return () => {
      this.channels.admin = this.channels.admin.filter(
        (sub) => sub !== subscriber,
      )
    }
  }

  subscribe(userId: string, subscriber: Subscriber) {
    if (!this.channels[userId]) {
      this.channels[userId] = []
    }

    this.channels[userId].push(subscriber)
    console.log(
      'Subscribed to channel',
      userId,
      'Total subscribers:',
      this.channels[userId].length,
    )

    return () => {
      this.channels[userId] = this.channels[userId].filter(
        (sub) => sub !== subscriber,
      )
      console.log(
        'Unsubscribed from channel',
        userId,
        'Remaining subscribers:',
        this.channels[userId].length,
      )
    }
  }

  async publish(notification: Notification) {
    await sendNotification(notification)

    console.log('Publishing notification', notification)
    console.log('Channels', this.channels)

    // Handle notifications to all subscribers
    if (notification.channel === 'all' && this.channels['*']) {
      console.log('Publishing to all subscribers')
      for (const subscriber of this.channels['*']) {
        try {
          subscriber(notification)
        } catch (error) {
          console.error('Error publishing to subscriber:', error)
        }
      }
    }

    // Handle notifications to admin subscribers
    if (notification.notificationTo === 'admin' && this.channels.admin) {
      console.log('Publishing to admin subscribers')
      for (const subscriber of this.channels.admin) {
        try {
          subscriber(notification)
        } catch (error) {
          console.error('Error publishing to admin subscriber:', error)
        }
      }
    }

    // Handle notifications to specific user
    const userId = notification?.userId ?? ''
    if (this.channels[userId]) {
      console.log('Publishing to user channel:', userId)
      for (const subscriber of this.channels[userId]) {
        try {
          subscriber(notification)
        } catch (error) {
          console.error('Error publishing to user subscriber:', error)
        }
      }
    }
  }

  unsubscribe(userId: string, subscriber: Subscriber) {
    if (this.channels[userId]) {
      this.channels[userId] = this.channels[userId].filter(
        (sub) => sub !== subscriber,
      )
    }
  }

  unsubscribeFromAll(subscriber: Subscriber) {
    this.channels['*'] = this.channels['*'].filter((sub) => sub !== subscriber)
  }
}

export const notifications = new NotificationsPubSub()
