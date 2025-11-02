'use client'

import { CheckSquare, LucideList, Settings2 } from 'lucide-react'

import { ChevronRight } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { Icon } from './icon'
import { Database } from '@/db/types'

export const nav = [
  {
    title: 'Tipping',
    url: '#',
    icon: Icon.Tipping,
    isActive: true,
    items: [
      {
        title: 'Dashboard',
        url: '/tipping',
      },
      {
        title: 'Enter tips',
        url: '/tipping/add-tips',
      },
      {
        title: 'Championships',
        url: '/tipping/championships',
      },
    ],
  },
  {
    title: 'Results',
    url: '#',
    icon: LucideList,
    isActive: true,
    items: [
      {
        title: 'Leaderboard',
        url: '/tipping/leaderboard',
      },
      {
        title: 'Rules & Scoring',
        url: '/tipping/rules',
      },
    ],
  },
  {
    title: 'Manage' as const,
    url: '#',
    icon: Settings2,
    items: [
      {
        title: 'Groups',
        url: '/tipping/groups',
      },
      {
        title: 'Feedback',
        url: '/tipping/contact',
      },
      {
        title: 'Settings',
        url: '/tipping/settings',
      },
    ],
  },
]

export function NavMain({
  addTipsUrl,
  currentGroup,
  isAdmin,
}: {
  addTipsUrl: string | undefined
  currentGroup: Pick<Database.Group, 'name'> | undefined
  isAdmin: boolean
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {nav.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className='group/collapsible'
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className='text-xs font-medium text-muted-foreground transition-colors'
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.title === 'Manage' && isAdmin && currentGroup && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a
                          href={'/tipping/group-admin'}
                          title={`Settings for ${currentGroup.name}`}
                        >
                          <span>{currentGroup.name}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a
                          href={
                            subItem.url === '/tipping/add-tips'
                              ? addTipsUrl
                              : subItem.url
                          }
                        >
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
