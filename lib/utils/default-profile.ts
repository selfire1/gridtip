import { Profile } from '@/types'
import { Database } from '@/db/types'

export function getDefaultProfile(
  user: Pick<Database.User, 'profileImageUrl' | 'name'> & {
    image?: string | null
  },
) {
  return {
    image: user.profileImageUrl || user.image || undefined,
    name: user.name,
  } satisfies Profile
}
