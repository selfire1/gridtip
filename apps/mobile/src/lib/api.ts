import { MaybeSession, Session } from '@/hooks/use-dal'
import { getWebUrl } from './url'
import {
  GetConstructors,
  GetDrivers,
  GetLastUpdated,
  GetRaces,
  GetTipsResponse,
  MyGroupsResponse,
  NotificationPreferencesResponse,
} from '@gridtip/shared/api-types'
import { type Position } from '@gridtip/shared/get-form-fields'

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler
}

export async function api<TResult extends object>(
  path: string,
  session: MaybeSession,
  options?: Omit<RequestInit, 'headers'>,
) {
  if (!session) {
    throw new UnauthorizedError('No session')
  }
  const apiBaseUrl = getWebUrl('/api/v1/')
  const url = new URL(path, apiBaseUrl)
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    ...options,
  })
  if (response.status === 401) {
    onUnauthorized?.()
    throw new UnauthorizedError()
  }
  const text = await response.text()
  if (!response.ok) {
    throw new Error(text)
  }
  try {
    return JSON.parse(text) as TResult
  } catch (error) {
    console.error(text)
    throw error
  }
}

export async function getMyGroups(session: Session) {
  return await api<MyGroupsResponse>('my/groups', session)
}

export function getRaces(session: Session) {
  return api<GetRaces>('races', session)
}

export function getConstructors(session: Session) {
  return api<GetConstructors>('constructors', session)
}

export async function getDrivers(session: Session) {
  return api<GetDrivers>('drivers', session)
}

export async function getUpdatedState(session: Session) {
  return api<GetLastUpdated>('last-updated', session)
}

export async function getMyTips(
  session: Session,
  {
    raceId,
    groupId,
  }: {
    raceId: string
    groupId: string
  },
) {
  const params = new URLSearchParams({
    raceId,
    groupId,
  }).toString()
  const url = `my/tips?${params}`

  return api<GetTipsResponse>(url, session)
}

export async function getNotificationPreferences(session: Session) {
  return api<NotificationPreferencesResponse>(
    'notifications/preferences',
    session,
  )
}

export async function setNotificationPreferences(
  session: Session,
  enableNotifications: boolean,
) {
  return api<NotificationPreferencesResponse>(
    'notifications/preferences',
    session,
    {
      method: 'PATCH',
      body: JSON.stringify({ enableNotifications }),
    },
  )
}

export async function submitTips(
  session: Session,
  submitObject: Partial<Record<Position['name'], { id: string | undefined }>> & {
    groupId: string
    raceId: string
  },
) {
  const response = await api<{ ok: boolean; message: string }>('my/tips', session, {
    method: 'POST',
    body: JSON.stringify(submitObject),
  })

  return response
}
