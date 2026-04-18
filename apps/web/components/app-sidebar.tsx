import * as React from 'react'
import { GroupSwitcher } from '@/components/group-switcher'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { verifyIsAdmin, verifySession } from '@/lib/dal'
import { getGroupProfile } from '@/lib/utils/group-profile'
import { getCurrentGroup, getGroupsForUser } from '@/lib/utils/groups'
import { getNextRace } from '@/lib/utils/races'

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { userId, user } = await verifySession()
  const groupsOfUser = await getGroupsForUser(userId)
  const cookieGroup = await getCurrentGroup(userId)
  const profile = await getGroupProfile(cookieGroup)

  const nextRace = await getNextRace()

  const groups = groupsOfUser
    .toSorted((a, b) => b.joinedAt.valueOf() - a.joinedAt.valueOf())
    .map(({ group }) => ({
      ...group,
    }))

  const { isAdmin } = !cookieGroup
    ? { isAdmin: false }
    : await verifyIsAdmin(cookieGroup.id)

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <GroupSwitcher currentlySelected={cookieGroup} groups={groups} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          addTipsUrl={nextRace ? `/tipping/add-tips/${nextRace.id}` : undefined}
          currentGroup={cookieGroup}
          isAdmin={isAdmin}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{ ...user, profileImageUrl: user.profileImageUrl || null }}
          groupProfile={profile}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
