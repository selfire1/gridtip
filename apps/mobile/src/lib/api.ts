import { MaybeSession, Session } from '@/hooks/use-dal'
import { getWebUrl } from './url'
import {
  GetConstructors,
  GetDrivers,
  GetLastUpdated,
  GetRaces,
  GetTipsResponse,
  MyGroupsResponse,
} from '@gridtip/shared/api-types'
import { type Position } from '@gridtip/shared/get-form-fields'

export async function api<TResult extends object>(
  path: string,
  session: MaybeSession,
  options?: Omit<RequestInit, 'headers'>,
) {
  if (!session) {
    throw new Error('No session')
  }
  const apiBaseUrl = getWebUrl('/api/v1/')
  const url = new URL(path, apiBaseUrl)
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    ...options,
  })
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
