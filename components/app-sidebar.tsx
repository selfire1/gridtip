import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { GroupSwitcher } from '@/components/group-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { verifySession } from '@/lib/dal'
import { getCurrentGroup, getGroupsForUser } from '@/lib/repository'
import { getImageHref } from '@/lib/utils/user'

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { userId, user } = await verifySession()
  const groupsOfUser = await getGroupsForUser(userId)
  const cookieGroup = await getCurrentGroup(userId)

  const groups = groupsOfUser
    .toSorted((a, b) => b.joinedAt.valueOf() - a.joinedAt.valueOf())
    .map(({ group }) => ({
      ...group,
    }))

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <GroupSwitcher currentlySelected={cookieGroup} groups={groups} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            avatar: getImageHref(user),
            email: user.email,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
