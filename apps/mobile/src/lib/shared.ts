import type { Constructor } from '@/types'
import { apiBaseUrl } from './constants'
import { getWebUrl } from './url'

export function getConstructorImage(id: Constructor['id']) {
  const path = `/img/constructors/${id}.webp`
  return getWebUrl(path)
}
