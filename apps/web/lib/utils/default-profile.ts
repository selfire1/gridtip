import { Profile } from '@/types'
import { Database } from '@/db/types'

export function getDefaultProfile(
  user: Pick<Database.User, 'name'> & {
    image?: string | null | undefined
    profileImageUrl?: string | null | undefined
  },
) {
  return {
    image: user.profileImageUrl || user.image || undefined,
    name: user.name,
  } satisfies Profile
}
