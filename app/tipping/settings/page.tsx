import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DeleteAccount from './_components/delete-account'
import { verifySession } from '@/lib/dal'
import { getGroupsForUser } from '@/lib/utils/groups'
import { ProfileSettings } from './_components/profile-settings'
import { db } from '@/db'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const { user } = await verifySession()

  // Fetch user groups with their member profiles
  const userGroups = await getGroupsForUser(user.id)

  // Fetch member profiles for each group
  const groupsWithProfiles = await Promise.all(
    userGroups.map(async ({ group }) => {
      const memberProfile = await db.query.groupMembersTable.findFirst({
        where: (table, { eq, and }) =>
          and(eq(table.groupId, group.id), eq(table.userId, user.id)),
        columns: {
          userName: true,
          profileImage: true,
        },
      })

      return {
        group,
        memberProfile: {
          name: memberProfile?.userName ?? user.name,
          image: memberProfile?.profileImage ?? null,
        },
      }
    })
  )

  return (
    <div className='space-y-6'>
      <ProfileSettings user={user} groups={groupsWithProfiles} />
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
