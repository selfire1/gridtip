import {
  getConstructorOptions,
  getCurrentGroupId,
  getDriverOptions,
} from '@/lib/repository'
import AlertNoGroup from '../components/alert-no-group'
import { db } from '@/db'
import { verifySession } from '@/lib/dal'
import Alert from '@/components/alert'
import { LucideArrowLeft, LucideArrowRight, LucideClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import TipForm from './components/TipForm'
import { Database } from '@/db/types'
import { RacePredictionField } from '@/constants'
import { predictionsTable } from '@/db/schema/schema'
import { eq } from 'drizzle-orm'
import {
  getClosedFields,
  getIsSprint,
  getPositionType,
  isPredictionForRace,
  isRaceAbleToBeTipped,
} from '@/lib/utils/prediction-fields'
import { Separator } from '@/components/ui/separator'
import CountryFlag from '@/components/country-flag'
import RaceTimes from '@/components/race-times'

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
  const closedFields = getClosedFields(race, currentGroup.cutoffInMinutes)

  const drivers = await getDriverOptions()
  const constructors = await getConstructorOptions()

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
        <RaceTimes race={race} cutoff={currentGroup.cutoffInMinutes} />
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
          <h1 className='page-title'>{race.raceName}</h1>
          <p>
            <span className='text-sm mt-2 text-muted-foreground font-medium'>
              {race.circuitName}
            </span>
          </p>
        </div>
      </div>
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
}
