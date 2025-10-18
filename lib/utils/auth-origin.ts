import { QueryOrigin } from '@/constants'

export function getAuthLinkWithOrigin(origin: QueryOrigin) {
  return `/auth?origin=${origin}`
}
