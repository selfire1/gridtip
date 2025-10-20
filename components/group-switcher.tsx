'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Database } from '@/db/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'
import { GROUP_ID_COOKIE_MAX_AGE, GROUP_ID_COOKIE_NAME } from '@/constants'
import { IconFromName } from '@/components/icon-from-name'
import { clearClientCookie, setClientCookie } from '@/lib/utils/group-cookie'

type GroupData = Pick<Database.Group, 'id' | 'name' | 'iconName'>

export function GroupSwitcher({
  currentlySelected,
  groups,
}: {
  currentlySelected: GroupData | undefined
  groups: GroupData[]
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const [isPending, startTransition] = React.useTransition()
  const [selectedGroup, setGroupToState] = React.useState(currentlySelected)

  // set initial cookie
  React.useEffect(() => {
    if (selectedGroup) {
      return
    }
    setGroupAndCookie(groups[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // check if there are other groups
  const [hasOtherGroups, setHasOtherGroups] = React.useState(false)
  React.useEffect(() => {
    setHasOtherGroups(!!getOtherGroups()?.length)

    function getOtherGroups() {
      return groups.filter((group) => group?.id !== selectedGroup?.id)
    }
  }, [selectedGroup, groups])

  if (!hasOtherGroups) {
    return (
      <div className='flex items-center p-2 gap-2'>
        <CurrentGroupLabel />
      </div>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger disabled={isPending} asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <CurrentGroupLabel />
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Groups
            </DropdownMenuLabel>
            {groups.map((group) => (
              <DropdownMenuItem
                key={group.name}
                onClick={() => setGroupAndCookie(group)}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-md border'>
                  <IconFromName
                    iconName={group.iconName}
                    className='size-3.5 shrink-0'
                    fallback='lucide:users'
                  />
                </div>
                {group.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )

  function CurrentGroupLabel() {
    return (
      <>
        <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
          <IconFromName
            iconName={selectedGroup?.iconName ?? 'lucide:users'}
            className='size-4'
            fallback='lucide:users'
          />
        </div>
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-medium'>
            {isPending
              ? 'Switching…'
              : (selectedGroup?.name ?? 'Select a group')}
          </span>
        </div>
      </>
    )
  }

  function setGroupAndCookie(group: GroupData | undefined) {
    if (isPending) {
      return
    }
    setGroupToState(group)

    if (!group) {
      clearClientCookie()
      return
    }
    setClientCookie(group.id)

    startTransition(() => {
      router.refresh()
    })
  }
}
