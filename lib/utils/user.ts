import { Database } from '@/db/types'

export const user = {
  getImageHref(user: Pick<Database.User, 'id'>) {
    return `/img/user/${user.id}.png`
  },
}
