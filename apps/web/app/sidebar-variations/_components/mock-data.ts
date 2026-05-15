import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  ListOrdered,
  MessageSquare,
  PencilLine,
  Settings,
  Settings2,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Icon } from '@/components/icon'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  shortcut?: string
  active?: boolean
}

export type NavSection = {
  title: string
  icon: LucideIcon
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: 'Tipping',
    icon: Icon.Tipping,
    items: [
      {
        title: 'Dashboard',
        href: '#',
        icon: LayoutDashboard,
        shortcut: 'G D',
        active: true,
      },
      { title: 'Enter tips', href: '#', icon: PencilLine, shortcut: 'G T' },
      { title: 'Championships', href: '#', icon: Trophy, shortcut: 'G C' },
    ],
  },
  {
    title: 'Results',
    icon: ListOrdered,
    items: [
      { title: 'Leaderboard', href: '#', icon: BarChart3, shortcut: 'G L' },
      { title: 'Rules & Scoring', href: '#', icon: BookOpen, shortcut: 'G R' },
    ],
  },
  {
    title: 'Manage',
    icon: Settings2,
    items: [
      { title: 'Groups', href: '#', icon: Users, shortcut: 'G G' },
      { title: 'Feedback', href: '#', icon: MessageSquare, shortcut: 'G F' },
      { title: 'Settings', href: '#', icon: Settings, shortcut: 'G S' },
    ],
  },
]

export const mockGroup = {
  name: 'Box Box Tippers',
  initials: 'BB',
}

export const mockUser = {
  name: 'Lewis Hamilton',
  email: 'lewis@gridtip.app',
  initials: 'LH',
}
