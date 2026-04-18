import { apiBaseUrl } from '@/lib/constants'

export function getWebUrl(path: string) {
  return new URL(path, apiBaseUrl).toString()
}
