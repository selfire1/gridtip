import { getCurrentGroupId } from '@/lib/repository'
import AlertNoGroup from '../components/alert-no-group'
import { db } from '@/db'
import { verifySession } from '@/lib/dal'
import Alert from '@/components/alert'
import { isFuture, isPast } from 'date-fns'
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideClock,
  LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import TipForm from './components/TipForm'
import { Database } from '@/db/types'
import { RacePredictionField } from '@/constants'
import { predictionsTable } from '@/db/schema/schema'
import { eq } from 'drizzle-orm'
import {
  getClosedFields,
  getIsSprint,
  getPositionType,
  getTipsDue,
  isPredictionForRace,
  isRaceAbleToBeTipped,
} from '@/lib/utils/prediction-fields'
import { Separator } from '@/components/ui/separator'
import { Icon } from '@/components/icon'
import CountryFlag from '@/components/country-flag'

export default async function RaceFormPage({
  params,
}: {
  params: Promise<{ 'race-id': string }>
}) {
  const { userId } = await verifySession()

  const currentGroupId = await getCurrentGroupId()
  if (!currentGroupId) {
    return <AlertNoGroup />
  }

  const currentGroup = await db.query.groupsTable.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, currentGroupId)
    },
    columns: {
      cutoffInMinutes: true,
    },
  })

  if (!currentGroup) {
    return <AlertNoGroup />
  }

  const { 'race-id': raceId } = await params
  const race = await db.query.racesTable.findFirst({
    where: (race, { eq }) => eq(race.id, raceId),
  })

  if (!race) {
    return <Alert title='No race found' />
  }

  const [next, previous] = await db.query.racesTable.findMany({
    where: (selectRace, { or, eq }) =>
      or(
        eq(selectRace.round, race.round + 1),
        eq(selectRace.round, race.round - 1),
      ),
    columns: {
      id: true,
      country: true,
    },
    orderBy: (race, { desc }) => desc(race.round),
  })

  const isSprint = getIsSprint(race)
  const tipsDue = getTipsDue(race, currentGroup.cutoffInMinutes)
  const closedFields = getClosedFields(race, currentGroup.cutoffInMinutes)

  const drivers = await db.query.driversTable.findMany({
    columns: {
      id: true,
      constructorId: true,
      givenName: true,
      familyName: true,
    },
    orderBy: (driver, { asc }) => asc(driver.familyName),
  })

  const constructors = await db.query.constructorsTable.findMany({
    columns: {
      id: true,
      name: true,
    },
    orderBy: (constructor, { asc }) => asc(constructor.name),
  })

  const tips = await getTips({
    userId,
    groupId: currentGroupId,
    raceId: race.id,
  })

  const isRaceClosed = !isRaceAbleToBeTipped(race, currentGroup.cutoffInMinutes)

  return (
    <div className='space-y-8 mb-12'>
      <div className='flex flex-wrap gap-y-6 gap-x-4 justify-between items-center'>
        <Hero race={race} />
        <Times race={race} />
      </div>
      <Separator />
      {isRaceClosed && (
        <Alert
          title='Tipping closed'
          description='The deadline for tipping this race has passed.'
          icon={LucideClock}
        />
      )}
      <section>
        <TipForm
          drivers={drivers}
          constructors={constructors}
          isSprint={isSprint}
          disabledFields={closedFields}
          defaultValues={{
            ...tips,
            groupId: currentGroupId,
            raceId: race.id,
          }}
          isFormDisabled={isRaceClosed}
          race={race}
        />
      </section>
      <Separator className='my-8' />
      <NavigationButtons />
    </div>
  )

  async function getTips(info: {
    userId: string
    groupId: string
    raceId: string
  }) {
    const isForCurrentUser = eq(predictionsTable.userId, info.userId)
    const isForSuppliedGroup = eq(predictionsTable.groupId, info.groupId)
    const isForRace = eq(predictionsTable.raceId, info.raceId)

    const rawTips = await db.query.predictionEntriesTable.findMany({
      where: (table, { inArray, and }) =>
        inArray(
          table.predictionId,
          db
            .select({ id: predictionsTable.id })
            .from(predictionsTable)
            .where(and(isForCurrentUser, isForSuppliedGroup, isForRace)),
        ),
      with: {
        prediction: {
          columns: {
            raceId: true,
          },
        },
        driver: {
          columns: {
            constructorId: true,
            givenName: true,
            familyName: true,
            id: true,
          },
        },
        constructor: true,
      },
    })

    return rawTips.reduce(
      (acc, tip) => {
        const position = tip.position
        if (!isPredictionForRace(position)) {
          return acc
        }
        const savedTip =
          getPositionType(position) === 'driver' ? tip.driver : tip.constructor
        if (!savedTip) {
          return acc
        }
        acc[position] = savedTip
        return acc
      },
      {} as Record<RacePredictionField, { id: string }>,
    )
  }

  function Hero({ race }: { race: Database.Race }) {
    return (
      <div className='flex items-center gap-8 flex-row-reverse sm:flex-row justify-end sm:justify-start sm:gap-4'>
        <CountryFlag
          country={race.country}
          className='size-16 sm:size-20 object-cover rounded-full border-2'
        />
        <div>
          <p className='text-sm text-muted-foreground'>Round {race.round}</p>
          <h1 className='scroll-m-20 text-2xl font-semibold text-balance tracking-tight sm:text-3xl xl:text-4xl'>
            {race.raceName}
          </h1>
          <p>
            <span className='text-sm mt-2 text-muted-foreground font-medium'>
              {race.circuitName}
            </span>
          </p>
        </div>
      </div>
    )
  }

  function Times({ race }: { race: Database.Race }) {
    return (
      <section className='flex gap-4'>
        {isSprint && tipsDue.sprint && (
          <TimeTile
            title='Sprint tips due'
            date={tipsDue.sprint}
            icon={Icon.Tipping}
            isActive={isFuture(tipsDue.sprint)}
          />
        )}
        <TimeTile
          title={isSprint ? 'GP tips due' : 'Tips due'}
          date={tipsDue.grandPrix}
          icon={Icon.Tipping}
          isActive={
            isFuture(tipsDue.grandPrix) &&
            (tipsDue.sprint ? isPast(tipsDue.sprint) : true)
          }
        />
        <TimeTile
          title='Qualifying'
          date={race.qualifyingDate}
          icon={Icon.Qualifying}
          isActive={isFuture(race.qualifyingDate) && isPast(tipsDue.grandPrix)}
        />
        <TimeTile
          title='Grand Prix'
          date={race.grandPrixDate}
          icon={Icon.GrandPrix}
          isActive={isFuture(race.grandPrixDate) && isPast(tipsDue.grandPrix)}
        />
      </section>
    )
  }

  function NavigationButtons({ children }: { children?: React.ReactNode }) {
    return (
      <section>
        <div className='flex justify-between items-center'>
          <NavigationButton
            title={previous?.country}
            id={previous?.id}
            direction='previous'
          />
          {children}
          <NavigationButton
            title={next?.country}
            id={next?.id}
            direction='next'
          />
        </div>
      </section>
    )
  }

  function TimeTile(props: {
    title: string
    date: Date
    isActive: boolean
    icon: LucideIcon
    className?: string
  }) {
    return (
      <div
        className={[
          'text-sm py-2 px-4 border rounded-lg',
          props.isActive
            ? ''
            : 'text-muted-foreground hidden sm:block border-transparent',
          props.className ?? '',
        ].join(' ')}
      >
        <p className='text-xs flex items-center gap-1 font-medium text-muted-foreground'>
          <props.icon size={12} />
          {props.title}
        </p>
        <p className='flex flex-col font-medium leading-tight'>
          <span>{getLocalDateString(props.date)}</span>
          <span className='uppercase'>{getLocalTimeString(props.date)}</span>
        </p>
      </div>
    )
  }

  function NavigationButton(props: {
    title: string | undefined
    id: string | undefined
    direction: 'previous' | 'next'
  }) {
    const { id, direction } = props
    return (
      <Button asChild variant='secondary'>
        <Link
          href={!id ? '#' : `/tipping/add-tips/${id}`}
          aria-disabled={!id}
          className={!id ? 'pointer-events-none opacity-50' : ''}
          title={props.title}
        >
          {direction === 'previous' && <LucideArrowLeft size={16} />}
          {direction === 'next' ? 'Next' : 'Previous'}
          {direction === 'next' && <LucideArrowRight size={16} />}
        </Link>
      </Button>
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
