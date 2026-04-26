import { QueryOrigin } from '@/constants'
import { Path } from './path'

export function getAuthLinkWithOrigin(origin: QueryOrigin) {
  return `${Path.Login}?origin=${origin}`
}
