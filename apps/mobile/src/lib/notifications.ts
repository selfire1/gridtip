import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import type { Session } from '@/hooks/use-dal'
import { api } from './api'

export async function requestAndRegisterPushToken(session: Session) {
  if (Platform.OS !== 'ios') {
    return { ok: false, reason: 'not-ios' as const }
  }
  if (!Device.isDevice) {
    return { ok: false, reason: 'not-physical-device' as const }
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    })
    status = requested.status
  }
  if (status !== 'granted') {
    return { ok: false, reason: 'permission-denied' as const }
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  if (!projectId) {
    return { ok: false, reason: 'no-project-id' as const }
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId })
  const token = tokenResult.data

  await api<{ message: string }>('notifications/register', session, {
    method: 'POST',
    body: JSON.stringify({ token, platform: 'ios' }),
  })

  return { ok: true as const, token }
}
