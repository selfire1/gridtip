import { LucideIcon, LucideUsers } from 'lucide-react'
import * as React from 'react'

export const SUPPORTED_ICON_NAMES = ['lucide:users'] as const
type IconName = (typeof SUPPORTED_ICON_NAMES)[number]

export function IconFromName(props: {
  iconName: string
  className?: string
  fallback?: IconName
}): React.ReactNode {
  const stringToIcon = new Map<IconName, LucideIcon>([
    ['lucide:users', LucideUsers],
  ])

  console.assert(
    SUPPORTED_ICON_NAMES.includes(props.iconName as IconName),
    'invalid icon name',
  )

  const IconComponent =
    stringToIcon.get(props.iconName as IconName) ||
    (props.fallback ? stringToIcon.get(props.fallback) : undefined)
  if (!IconComponent) {
    return
  }
  return <IconComponent className={props.className} />
}
