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

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      id: 'Acme Inc',
      name: 'Acme Inc',
      logo: '🏁',
    },
    {
      id: 'Acme Corp.',
      name: 'Acme Corp.',
      logo: '🏎️',
    },
    {
      id: 'Evil Corp.',
      name: 'Evil Corp.',
      logo: '😄',
    },
  ],
}

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { userId } = await verifySession()
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
