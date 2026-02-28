import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className='space-y-6'>
      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>Profiles</h2>
        <Profiles defaultProfile={defaultProfile} groups={groups} />
      </section>
      <DeleteCard />
    </div>
  )

  function DeleteCard() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccount />
        </CardContent>
      </Card>
    )
  }
}
