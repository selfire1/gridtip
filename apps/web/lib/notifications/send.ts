import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk'
import type { NotificationToSend } from './compute-notifications'

const expo = new Expo()

export type SendResult = {
  notification: NotificationToSend
  ok: boolean
  ticketId?: string
  error?: string
}

export async function sendNotifications(
  notifications: NotificationToSend[],
): Promise<SendResult[]> {
  const messagesWithRefs: {
    notification: NotificationToSend
    message: ExpoPushMessage
  }[] = []

  for (const n of notifications) {
    const validTokens = n.pushTokens.filter((t) => Expo.isExpoPushToken(t))
    if (validTokens.length === 0) continue

    const { title, body } = buildContent(n)
    messagesWithRefs.push({
      notification: n,
      message: {
        to: validTokens,
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

  const messages = messagesWithRefs.map((m) => m.message)
  const chunks = expo.chunkPushNotifications(messages)
  const tickets: ExpoPushTicket[] = []

  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk)
      tickets.push(...chunkTickets)
    } catch (error) {
      console.error('expo send chunk failed', error)
      for (let i = 0; i < chunk.length; i++) {
        tickets.push({ status: 'error', message: (error as Error).message })
      }
    }
  }

  return messagesWithRefs.map(({ notification }, i) => {
    const ticket = tickets[i]
    if (!ticket || ticket.status === 'error') {
      return {
        notification,
        ok: false,
        error: ticket?.message ?? 'no ticket',
      }
    }
    return { notification, ok: true, ticketId: ticket.id }
  })
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
