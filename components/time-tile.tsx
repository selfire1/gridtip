'use client'

import clsx from 'clsx'
import { Icon } from './icon'

export function TimeTile(props: {
  title: string
  date: Date
  isActive: boolean
  icon: keyof typeof Icon
  className?: string
}) {
  return (
    <div
      className={clsx(
        'text-sm py-2 px-4 border bg-card rounded-lg',
        !props.isActive &&
          'text-muted-foreground hidden sm:block border-transparent',
        props.className,
      )}
    >
      <p className='text-xs flex items-center gap-1 font-medium text-muted-foreground'>
        <TypeIcon />
        <span className='whitespace-nowrap'>{props.title}</span>
      </p>
      <p className='flex flex-col font-medium leading-tight'>
        <span className='whitespace-nowrap'>
          {getLocalDateString(props.date)}
        </span>
        <span className='uppercase whitespace-nowrap'>
          {getLocalTimeString(props.date)}
        </span>
      </p>
    </div>
  )

  function TypeIcon() {
    switch (props.icon) {
      case 'Tipping':
        return <Icon.Tipping size={12} className='shrink-0' />
      case 'Group':
        return <Icon.Group size={12} className='shrink-0' />
      case 'Qualifying':
        return <Icon.Qualifying size={12} className='shrink-0' />
      case 'GrandPrix':
        return <Icon.GrandPrix size={12} className='shrink-0' />
      case 'Sprint':
        return <Icon.Sprint size={12} className='shrink-0' />
      case 'Constructor':
        return <Icon.Constructor size={12} className='shrink-0' />
    }
  }
  function getLocalDateString(date: Date) {
    const formatter = Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      weekday: 'short',
      month: 'short',
      year:
        new Date().getFullYear() === date.getFullYear() ? undefined : 'numeric',
    })
    return formatter.format(date)
  }
  function getLocalTimeString(date: Date) {
    const formatter = Intl.DateTimeFormat('en-AU', {
      timeStyle: 'short',
    })
    return formatter.format(date)
  }
}
