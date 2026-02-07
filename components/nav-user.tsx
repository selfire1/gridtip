'use client'

import { ChevronsUpDown, LogOut } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import UserAvatar from './user-avatar'
import { Path } from '@/lib/utils/path'
import { User } from '@/db/schema/schema'
import { Profile } from '@/types'
import { getDefaultProfile } from '@/lib/utils/default-profile'

export function NavUser({
  user,
  groupProfile,
}: {
  user: Pick<User, 'id' | 'name' | 'profileImageUrl' | 'email'>
  groupProfile: Profile | undefined
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const defaultUser = getDefaultProfile({ ...user, image: null })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              {!groupProfile ? (
                <ProfileRow name={defaultUser.name} image={defaultUser.image} />
              ) : (
                <ProfileRow
                  name={groupProfile.name}
                  image={groupProfile?.image}
                />
              )}
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <UserAvatar {...user} className='h-8 w-8 rounded-lg' />
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <button
              className='w-full'
              onClick={async () =>
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess() {
                      // TODO: use `useTransition`, remove `router.refresh()`
                      router.push(Path.Login)
                      router.refresh()
                    },
                  },
                })
              }
            >
              <DropdownMenuItem>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </button>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function ProfileRow({
  name,
  image,
}: {
  name: string
  image: string | undefined
}) {
  return (
    <>
      <UserAvatar
        name={name}
        profileImageUrl={image || null}
        className='h-8 w-8 rounded-lg'
      />
      <div className='grid flex-1 text-left text-sm leading-tight'>
        <span className='truncate font-medium'>{name}</span>
      </div>
    </>
  )
}
