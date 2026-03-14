import { CardContent } from '@/components/ui/card'
import { FlagBackgroundCard } from './card-flag-background'
import { RaceHeader } from './race-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RACE_PREDICTION_FIELDS, RacePredictionField } from '@/constants'
import { db } from '@/db'
import { getLabel } from '@/lib/utils/prediction-fields'
import { getConstructorCssVariable } from '@/lib/utils/constructor-css'
import { cn } from '@/lib/utils'
import Constructor from '@/components/constructor'
import { verifySession } from '@/lib/dal'
import UserAvatar from '@/components/user-avatar'
import { and, eq, inArray } from 'drizzle-orm'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { GLOBAL_GROUP_ID } from '@/constants/group'

type CardOngoingProps = {
  raceId: string
  groupId: string
  collapsed?: boolean
}

type PredictionEntry = Awaited<ReturnType<typeof getPredictionEntries>>[number]
export async function CardEveryonesTips({
  raceId,
  groupId,
  collapsed,
}: CardOngoingProps) {
  const { userId } = await verifySession()
  const predictionEntries = await getPredictionEntries({ raceId, groupId })
  const positionToTips = reduceIntoObject(predictionEntries)

  const seenDriverMap = new Map<string, 'first' | 'second'>()
  const seenConstructors = new Set<string>()

  const race = await getRaceInfo(raceId)
  const positionTips = getTipsOnPosition()

  const usersByTip = getUsersByTip(positionTips)

  if (groupId === GLOBAL_GROUP_ID) {
    return (
      <FlagBackgroundCard race={race}>
        {race && <RaceHeader title='Race Weekend ongoing' race={race} />}

        <CardContent>
          <p>
            Your standing in the Global Group will be updated after the Grand
            Prix.
          </p>
        </CardContent>
      </FlagBackgroundCard>
    )
  }

  return (
    <FlagBackgroundCard race={race}>
      {race && (
        <RaceHeader
          title='Race tips'
          race={race}
          description={
            <>
              See everyone’s tips for the{' '}
              <span className='font-medium'>{race?.raceName}</span>
            </>
          }
        />
      )}

      {!!positionTips.length ? (
        <TipsAccordion />
      ) : (
        <CardContent>
          <p className='text-muted-foreground text-sm'>No one has tipped yet</p>
        </CardContent>
      )}
    </FlagBackgroundCard>
  )

  function getUsersByTip(entries: typeof positionTips) {
    return entries.map(({ position, tips }) => {
      const tipsByValue = tips.reduce(
        (acc, tip) => {
          const { value, member } = tip
          if (!value) {
            return acc
          }
          const exists = acc.find((accTip) => accTip.tip.id === value.id)
          const mappedMember = {
            id: member.id,
            profileImage: member.profileImageUrl || null,
            userName: member.name,
          }
          if (exists) {
            exists.members.push(mappedMember)
            return acc
          }
          acc.push({ tip: value, members: [mappedMember] })
          return acc
        },
        [] as Array<{
          tip: NonNullable<
            (typeof positionTips)[number]['tips'][number]['value']
          >
          members: Array<PredictionEntry['prediction']['member']>
        }>,
      )
      return {
        position,
        tipsByValue: tipsByValue.toSorted((a, b) => {
          return getValue(a.tip).localeCompare(getValue(b.tip))

          function getValue(tip: typeof a.tip) {
            const isDriver = 'constructorId' in tip
            return isDriver ? tip.familyName : tip.name
          }
        }),
      }
    })
  }
  function TipsAccordion() {
    return (
      <CardContent>
        <Accordion
          type='single'
          collapsible={true}
          defaultValue={collapsed ? undefined : positionTips[0].position}
        >
          {usersByTip.map(({ position, tipsByValue }) => {
            return (
              <AccordionItem key={position} value={position}>
                <AccordionTrigger>{getLabel(position)}</AccordionTrigger>
                <AccordionContent className='space-y-4'>
                  {tipsByValue.map(({ tip, members: users }) => {
                    return (
                      <TipRowByUser key={tip.id} members={users} tip={tip} />
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    )
  }

  function getTipsOnPosition() {
    return RACE_PREDICTION_FIELDS.reduce(
      (acc, position) => {
        const tips = positionToTips[position]
        if (!tips?.length) {
          return acc
        }
        acc.push({ tips, position })
        return acc
      },
      [] as {
        tips: (typeof positionToTips)[RacePredictionField]
        position: RacePredictionField
      }[],
    )
  }

  async function getRaceInfo(raceId: string) {
    return (await db.query.racesTable.findFirst({
      where: (race, { eq }) => eq(race.id, raceId),
      columns: {
        country: true,
        raceName: true,
      },
    }))!
  }

  function TipRowByUser({
    tip,
    members,
  }: {
    members: PredictionEntry['prediction']['member'][]
    tip: PredictionEntry['constructor'] | PredictionEntry['driver']
  }) {
    if (!tip) {
      return
    }
    const isDriver = 'constructorId' in tip
    const cssVariable = {
      ['--team-colour' as string]: getConstructorCssVariable(
        isDriver ? tip.constructorId : tip.id,
      ),
    }

    const teamBg = isDriver
      ? {
          ...getStyleForDriver(tip.id, tip.constructorId),
        }
      : {}

    return (
      <div className='bg-background overflow-hidden rounded-lg border'>
        <div
          className={cn(
            'relative isolate p-3 border-b',
            !isDriver && `bg-(--team-colour)/5`,
          )}
          style={{ ...cssVariable, ...teamBg }}
        >
          <div>
            {isDriver ? (
              <div>
                <p className='relative z-10 pr-2 font-medium'>
                  {tip.familyName}
                </p>
                <p className='text-3xl font-bold font-mono absolute right-2 inset-y-0 flex items-center justify-center bg-gradient-to-b from-(--team-colour)/30 to-(--team-colour)/10 text-transparent bg-clip-text'>
                  {tip.permanentNumber ?? ''}
                </p>
              </div>
            ) : (
              <Constructor constructor={tip} className='font-medium' />
            )}
          </div>
        </div>
        <div className='space-y-3 p-3 bg-background'>
          {members.map((member) => (
            <div
              className={cn(
                'flex items-center gap-2',
                member.id === userId && 'font-semibold',
              )}
              key={member.id}
            >
              <UserAvatar
                name={member.userName}
                profileImageUrl={member.profileImage}
                className='size-6 rounded-lg'
              />
              <p>{member.userName}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function getStyleForDriver(
    driverId: string,
    constructorId: string,
  ): React.CSSProperties {
    if (!seenDriverMap.has(driverId)) {
      const isConstructorSeen = seenConstructors.has(constructorId)
      seenDriverMap.set(driverId, !isConstructorSeen ? 'first' : 'second')
      seenConstructors.add(constructorId)
    }
    const GRADIENT = {
      start: 0.01,
      end: 0.1,
    } as const

    const colourStart = getConstructorCssVariable(constructorId, {
      opacity: GRADIENT.start,
    })
    const colourEnd = getConstructorCssVariable(constructorId, {
      opacity: GRADIENT.end,
    })
    const style = {
      backgroundImage: `linear-gradient(to ${seenDriverMap.get(driverId) === 'first' ? 'left' : 'right'}, ${colourStart} , ${colourEnd})`,
    }
    return style
  }

  function reduceIntoObject(entries: PredictionEntry[]) {
    type ReturnObject = Record<
      RacePredictionField,
      {
        id: string
        member: {
          name: string
          id: string
          profileImageUrl: string | undefined | null
        }
        position: RacePredictionField
        value: PredictionEntry['driver'] | PredictionEntry['constructor']
      }[]
    >

    const object = entries.reduce((acc, entry) => {
      const position = entry.position as RacePredictionField
      const mappedEntry = {
        id: entry.id,
        member: {
          name: entry.prediction.member.userName,
          id: entry.prediction.member.id,
          profileImageUrl: entry.prediction.member.profileImage,
        },
        position,
        value: entry.driver || entry.constructor,
      }
      if (!acc[position]) {
        acc[position] = [mappedEntry]
        return acc
      }
      acc[position].push(mappedEntry)
      return acc
    }, {} as ReturnObject)

    const sorted = Object.entries(object).reduce((acc, [key, values]) => {
      const items = values.toSorted((a, b) =>
        a.member.name.localeCompare(b.member.name),
      )
      acc[key as RacePredictionField] = items
      return acc
    }, {} as ReturnObject)

    return sorted
  }
}

async function getPredictionEntries({
  groupId,
  raceId,
}: {
  groupId: Database.GroupId
  raceId: Database.RaceId
}) {
  return await db.query.predictionEntriesTable.findMany({
    where: inArray(
      predictionEntriesTable.predictionId,
      db
        .select({ id: predictionsTable.id })
        .from(predictionsTable)
        .where(
          and(
            eq(predictionsTable.groupId, groupId),
            eq(predictionsTable.raceId, raceId),
          ),
        ),
    ),
    columns: {
      id: true,
      position: true,
    },
    with: {
      prediction: {
        columns: {
          raceId: true,
        },
        with: {
          member: {
            columns: {
              id: true,
              userName: true,
              profileImage: true,
            },
          },
        },
      },
      constructor: {
        columns: {
          id: true,
          name: true,
        },
      },
      driver: {
        columns: {
          constructorId: true,
          givenName: true,
          permanentNumber: true,
          familyName: true,
          id: true,
        },
      },
    },
  })
}
