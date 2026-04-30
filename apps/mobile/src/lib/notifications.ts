import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import type { Session } from '@/hooks/use-dal'
import { api } from './api'

export type PermissionStatus = Notifications.PermissionStatus

export type RegistrationResult =
  | { ok: true; status: 'granted'; token: string }
  | { ok: false; status: 'denied' | 'undetermined'; reason: 'permission-not-granted' }
  | { ok: false; status: null; reason: 'not-ios' | 'not-physical-device' | 'no-project-id' }

function preconditionFailure(): RegistrationResult | null {
  if (Platform.OS !== 'ios') {
    return { ok: false, status: null, reason: 'not-ios' }
  }
  if (!Device.isDevice) {
    return { ok: false, status: null, reason: 'not-physical-device' }
  }
  return null
}

async function registerToken(session: Session): Promise<RegistrationResult> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    return { ok: false, status: null, reason: 'no-project-id' }
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId })
  const token = tokenResult.data

  await api<{ message: string }>('notifications/register', session, {
    method: 'POST',
    body: JSON.stringify({ token, platform: 'ios' }),
  })

  return { ok: true, status: 'granted', token }
}

export async function registerPushTokenIfGranted(
  session: Session,
): Promise<RegistrationResult> {
  const failure = preconditionFailure()
  if (failure) return failure

  const { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') {
    return { ok: false, status, reason: 'permission-not-granted' }
  }
  return registerToken(session)
}

export async function requestPermissionAndRegisterPushToken(
  session: Session,
): Promise<RegistrationResult> {
  const failure = preconditionFailure()
  if (failure) return failure

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status === 'undetermined') {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    })
    status = requested.status
  }
  if (status !== 'granted') {
    return { ok: false, status, reason: 'permission-not-granted' }
  }
  return registerToken(session)
}
