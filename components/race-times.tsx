import { Database } from '@/db/types'
import { getIsSprint, getTipsDue } from '@/lib/utils/prediction-fields'
import { isFuture, isPast } from 'date-fns'
import { TimeTile } from './time-tile'

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
          icon='Sprint'
          isActive={isFuture(tipsDue.sprint)}
          className='snap-start'
        />
      )}
      <TimeTile
        title={isSprint ? 'GP tips due' : 'Tips due'}
        date={tipsDue.grandPrix}
        icon='Tipping'
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
        icon='Qualifying'
        isActive={isFuture(race.qualifyingDate) && isPast(tipsDue.grandPrix)}
      />
      <TimeTile
        title='Grand Prix'
        className='snap-start'
        date={race.grandPrixDate}
        icon='GrandPrix'
        isActive={isFuture(race.grandPrixDate) && isPast(tipsDue.grandPrix)}
      />
    </section>
  )
}
