import { MaybeSession } from '@/hooks/use-dal'
import { getWebUrl } from './url'

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
  try {
    return JSON.parse(text) as TResult
  } catch (error) {
    console.error(text)
    throw error
  }
}
