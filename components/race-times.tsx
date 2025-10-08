import { Database } from '@/db/types'
import { getIsSprint, getTipsDue } from '@/lib/utils/prediction-fields'
import clsx from 'clsx'
import { LucideIcon } from 'lucide-react'
import { Icon } from './icon'
import { isFuture, isPast } from 'date-fns'

export default function RaceTimes({
  race,
  cutoff,
}: {
  race: Database.Race
  cutoff: number
}) {
  const tipsDue = getTipsDue(race, cutoff)
  const isSprint = getIsSprint(race)
  return (
    <section className='flex snap-x gap-2 overflow-x-auto'>
      {isSprint && tipsDue.sprint && (
        <TimeTile
          title='Sprint tips due'
          date={tipsDue.sprint}
          icon={Icon.Tipping}
          isActive={isFuture(tipsDue.sprint)}
          className='snap-start'
        />
      )}
      <TimeTile
        title={isSprint ? 'GP tips due' : 'Tips due'}
        date={tipsDue.grandPrix}
        icon={Icon.Tipping}
        className='snap-start'
        isActive={
          isFuture(tipsDue.grandPrix) &&
          (tipsDue.sprint ? isPast(tipsDue.sprint) : true)
        }
      />
      <TimeTile
        title='Qualifying'
        className='snap-start'
        date={race.qualifyingDate}
        icon={Icon.Qualifying}
        isActive={isFuture(race.qualifyingDate) && isPast(tipsDue.grandPrix)}
      />
      <TimeTile
        title='Grand Prix'
        className='snap-start'
        date={race.grandPrixDate}
        icon={Icon.GrandPrix}
        isActive={isFuture(race.grandPrixDate) && isPast(tipsDue.grandPrix)}
      />
    </section>
  )
  function TimeTile(props: {
    title: string
    date: Date
    isActive: boolean
    icon: LucideIcon
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
          <props.icon size={12} className='shrink-0' />
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
