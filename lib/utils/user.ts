import { Database } from '@/db/types'

export function getImageHref(user: Pick<Database.User, 'id'>) {
  return `/img/user/${user.id}.png`
}
