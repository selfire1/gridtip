import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk'
import type { NotificationToSend } from './compute-notifications'

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN })

export type SendResult = {
  notification: NotificationToSend
  ok: boolean
  error?: string
}

export type SendNotificationsOutcome = {
  results: SendResult[]
  invalidTokens: string[]
}

type Item = {
  notification: NotificationToSend
  token: string
  message: ExpoPushMessage
}

export async function sendNotifications(
  notifications: NotificationToSend[],
): Promise<SendNotificationsOutcome> {
  const items: Item[] = []

  for (const n of notifications) {
    const { title, body } = buildContent(n)
    for (const token of n.pushTokens) {
      if (!Expo.isExpoPushToken(token)) continue
      items.push({
        notification: n,
        token,
        message: {
          to: token,
          title,
          body,
          sound: 'default',
          data: {
            raceId: n.raceId,
            tipType: n.tipType,
            reminderType: n.reminderType,
            variant: n.variant,
          },
        },
      })
    }
  }

  if (items.length === 0) {
    return {
      results: notifications.map((notification) => ({
        notification,
        ok: false,
        error: 'no valid tokens',
      })),
      invalidTokens: [],
    }
  }

  const chunks = expo.chunkPushNotifications(items.map((i) => i.message))
  const tickets: ExpoPushTicket[] = []

  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk)
      tickets.push(...chunkTickets)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('expo send chunk failed', message)
      for (let i = 0; i < chunk.length; i++) {
        tickets.push({ status: 'error', message })
      }
    }
  }

  type Aggregate = { ok: boolean; errors: string[] }
  const perNotification = new Map<NotificationToSend, Aggregate>()
  const invalidTokens = new Set<string>()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const ticket = tickets[i]
    const aggregate = perNotification.get(item.notification) ?? {
      ok: false,
      errors: [],
    }

    if (ticket?.status === 'ok') {
      aggregate.ok = true
    } else {
      aggregate.errors.push(ticket?.message ?? 'no ticket')
      const errorCode = ticket?.status === 'error' ? ticket.details?.error : undefined
      if (errorCode === 'DeviceNotRegistered') {
        invalidTokens.add(item.token)
      }
    }

    perNotification.set(item.notification, aggregate)
  }

  const results: SendResult[] = notifications.map((notification) => {
    const aggregate = perNotification.get(notification)
    if (!aggregate) {
      return { notification, ok: false, error: 'no valid tokens' }
    }
    if (aggregate.ok) return { notification, ok: true }
    return { notification, ok: false, error: aggregate.errors.join('; ') }
  })

  return { results, invalidTokens: Array.from(invalidTokens) }
}

function buildContent(n: NotificationToSend): { title: string; body: string } {
  const isSprint = n.tipType === 'sprint'
  const eventLabel = isSprint ? 'sprint' : 'Grand Prix'

  if (n.variant === 'last-chance') {
    return {
      title: 'Last chance to update your tips',
      body: `Tipping for the ${eventLabel} closes in ${n.reminderType === '24h' ? '24 hours' : '3 hours'}.`,
    }
  }

  if (n.reminderType === '24h') {
    return {
      title: 'Tipping closes tomorrow',
      body: `Get your ${eventLabel} tips in — tipping closes in 24 hours.`,
    }
  }

  return {
    title: 'Tipping closes soon',
    body: `Last chance to tip the ${eventLabel} — tipping closes in 3 hours.`,
  }
}
