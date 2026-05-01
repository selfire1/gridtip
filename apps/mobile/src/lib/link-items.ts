import { webRoutes, type WebRouteKey } from '@gridtip/shared/routes'
import {
  Award,
  BookOpen,
  MessageSquare,
  Settings as SettingsIcon,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react-native'
import * as WebBrowser from 'expo-web-browser'
import { getWebUrl } from '@/lib/url'

export type LinkItem = {
  title: string
  description: string
  routeKey: WebRouteKey
  icon: LucideIcon
}

export const linkItems: LinkItem[] = [
  {
    title: 'Leaderboard',
    description: 'See where you stand this season',
    routeKey: 'leaderboard',
    icon: Trophy,
  },
  {
    title: 'Championships',
    description: 'Drivers and constructors title picks',
    routeKey: 'championships',
    icon: Award,
  },
  {
    title: 'Groups',
    description: 'Manage your tipping groups',
    routeKey: 'groups',
    icon: Users,
  },
  {
    title: 'Rules & Scoring',
    description: 'How predictions are scored',
    routeKey: 'rules',
    icon: BookOpen,
  },
  {
    title: 'Account Settings',
    description: 'Profile, email, and account options on the web',
    routeKey: 'settings',
    icon: SettingsIcon,
  },
  {
    title: 'Feedback',
    description: 'Send a note to the GridTip team',
    routeKey: 'feedback',
    icon: MessageSquare,
  },
]

export function openLink(routeKey: WebRouteKey) {
  return WebBrowser.openBrowserAsync(getWebUrl(webRoutes[routeKey]))
}
