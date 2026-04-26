import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'
import { verifySession } from '@/lib/dal'
import { getDefaultProfile } from '@/lib/utils/default-profile'
import { getGroupProfile } from '@/lib/utils/group-profile'
import { getGroupsForUser } from '@/lib/utils/groups'
import DeleteAccount from './_components/delete-account'
import Profiles from './_components/profiles'

export const metadata: Metadata = {
  title: 'Settings',
}
export default async function SettingsPage() {
  const { user } = await verifySession()
  const defaultProfile = getDefaultProfile(user)
  const memberships = await getGroupsForUser(user.id)

  const groups = await Promise.all(
    memberships.map(async (membership) => {
      const profile = await getGroupProfile(membership.group)
      return {
        id: membership.group.id,
        name: membership.group.name,
        iconName: membership.group.iconName,
        profile: profile ?? { name: defaultProfile.name, image: defaultProfile.image },
      }
    }),
  )

  return (
    <div className='space-y-8'>
      <Profiles defaultProfile={defaultProfile} groups={groups} />
      <Separator />
      <section className='space-y-2'>
        <h2 className='text-sm font-medium'>Danger Zone</h2>
        <p className='text-sm text-muted-foreground'>
          Permanently delete your account and all associated data.
        </p>
        <div className='pt-2'>
          <DeleteAccount />
        </div>
      </section>
    </div>
  )
}
