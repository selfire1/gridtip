import { Button } from '@/components/ui/button'
import { getImageHref } from '@/lib/utils/user'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RACE_PREDICTION_FIELDS, RacePredictionField } from '@/constants'
import { db } from '@/db'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { verifySession } from '@/lib/dal'
import { getCurrentGroupId } from '@/lib/repository'
import {
  subDays,
  subMinutes,
  formatDistanceToNowStrict,
  differenceInHours,
} from 'date-fns'
import { and, eq, inArray } from 'drizzle-orm'
import { LucideArrowRight, LucideClock, LucideIcon } from 'lucide-react'
import React, { cache } from 'react'
import { getConstructorCssVariable } from '@/lib/utils/index'
import UserAvatar from '@/components/user-avatar'
import clsx from 'clsx'
import Constructor from '@/components/constructor'
import CountryFlag from '@/components/country-flag'
import { Database } from '@/db/types'
import Link from 'next/link'
import RaceTimes from '@/components/race-times'
import { getIsSprint, getTipsDue } from '@/lib/utils/prediction-fields'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/icon'

export default async function DashboardPage() {
  const { userId } = await verifySession()
  const currentUserGroup = await getCurrentGroupId()

  const getCutoff = cache(getCutoffUncached)
  const hasGroups = await getIsUserInGroups(userId)
  const ongoingRace = await getOngoingRace(userId)
  const nextRace = await getNextRace(userId)
  const previousRace = await getPreviousRace(nextRace?.round)

  return (
    <div className='is-grid-card-fit grid gap-8'>
      {(!hasGroups || !currentUserGroup) && <CardJoinGroup />}
      {currentUserGroup && <RequiresGroup groupId={currentUserGroup} />}
    </div>
  )

  function RequiresGroup({ groupId }: { groupId: string }) {
    return (
      <>
        {ongoingRace && (
          <CardEveryonesTips raceId={ongoingRace.id} groupId={groupId} />
        )}
        {previousRace && <CardPrevious race={previousRace} />}
        {nextRace && (
          <>
            <CardTipNext race={nextRace} groupId={groupId} />
            <CardTipStatus groupId={groupId} raceId={nextRace.id} />
          </>
        )}
      </>
    )
  }

  async function CardTipStatus({
    groupId,
    raceId,
  }: {
    groupId: Database.Group['id']
    raceId: Database.Race['id']
  }) {
    const { tipped, notTipped } = await getTippingStatus()
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipping status</CardTitle>
          <CardDescription>Who has tipped already?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            {tipped.length > 0 && (
              <UserList title='Tipped' Icon={Icon.Tipping} users={tipped} />
            )}
            {notTipped.length > 0 && (
              <UserList
                title='Yet To Tip'
                Icon={LucideClock}
                users={notTipped}
              />
            )}
          </div>
        </CardContent>
      </Card>
    )

    function UserList({
      title,
      Icon,
      users,
    }: {
      users: Array<Pick<Database.User, 'id' | 'name'>>
      title: string
      Icon: LucideIcon
    }) {
      return (
        <div className='space-y-2'>
          <p className='text-sm font-medium flex items-center gap-1 text-muted-foreground'>
            <Icon size={16} />
            {title}
          </p>
          <div className='rounded-lg overflow-hidden border'>
            <div className='space-y-4 p-4  h-32 overflow-y-auto'>
              {users.map((user) => (
                <div key={user.id} className='flex items-center gap-2'>
                  <UserAvatar
                    className='size-6 rounded-lg'
                    name={user.name}
                    id={user.id}
                  />
                  <p className='text-sm'>{user.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    async function getTippingStatus() {
      const groupMembers = (
        await db.query.groupMembersTable.findMany({
          where: (group, { eq }) => eq(group.groupId, groupId),
          columns: {
            id: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        })
      ).map((groupMember) => groupMember.user)

      const peopleWhoTippedThisRace = await db.query.predictionsTable.findMany({
        where: (prediction, { eq, and }) =>
          and(eq(prediction.groupId, groupId), eq(prediction.raceId, raceId)),
        columns: {
          id: true,
        },
        with: {
          user: {
            columns: {
              id: true,
            },
          },
        },
      })

      const tippersSet = new Set(peopleWhoTippedThisRace.map((p) => p.user.id))

      type Member = (typeof groupMembers)[number]

      return groupMembers.reduce(
        (acc, user) => {
          if (!tippersSet.has(user.id)) {
            acc.notTipped.push(user)
            return acc
          }
          acc.tipped.push(user)
          return acc
        },
        { tipped: [] as Member[], notTipped: [] as Member[] },
      )
    }
  }

  async function CardTipNext({
    race,
    groupId,
  }: {
    race: Database.Race
    groupId: Database.Group['id']
  }) {
    const cutoff = await getCutoff({ groupId: groupId, userId })
    if (cutoff === undefined) {
      return
    }
    const isSprint = getIsSprint(race)
    const tipsDue = getTipsDue(race, cutoff)
    const hasTipped = await getHasTipped()

    return (
      <Card>
        <RaceHeader
          race={race}
          title={
            <span className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                {isSprint && tipsDue.sprint && (
                  <Badge variant={getBadgeVariant(tipsDue.sprint)}>
                    Sprint tips due in{' '}
                    {formatDistanceToNowStrict(tipsDue.sprint)}
                  </Badge>
                )}
                <Badge variant={getBadgeVariant(tipsDue.grandPrix)}>
                  {isSprint ? 'GP tips due in ' : 'Due in '}
                  {formatDistanceToNowStrict(tipsDue.grandPrix)}
                </Badge>
              </div>
              <span>Predict the next race</span>
            </span>
          }
          description={
            <div className='flex items-center gap-2'>
              <p className='font-medium'>{race.raceName}</p>
              <p>{race.circuitName}</p>
            </div>
          }
        />
        <CardContent className='space-y-4'>
          <RaceTimes race={race} cutoff={cutoff} />
        </CardContent>
        <CardFooter className='mt-auto'>
          <Button asChild>
            <Link href={`/tipping/add-tips/${race.id}`}>
              {hasTipped ? 'Review tips' : 'Tip now'}
              <LucideArrowRight />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )

    function getBadgeVariant(
      due: Date,
    ): 'destructive' | 'default' | 'outline' | 'secondary' {
      const hoursToNow = differenceInHours(due, new Date())
      if (hoursToNow < 3) {
        return 'destructive'
      }
      if (hoursToNow < 24 * 2) {
        return 'default'
      }
      return 'secondary'
    }

    async function getHasTipped() {
      return !!(await db.query.predictionsTable.findFirst({
        where: (prediction, { eq, and }) =>
          and(
            eq(prediction.userId, userId),
            eq(prediction.groupId, groupId),
            eq(prediction.raceId, race.id),
          ),
      }))
    }
  }

  async function getPreviousRace(round: number | undefined) {
    if (!round) {
      return
    }
    return await db.query.racesTable.findFirst({
      where: (race, { eq, and, gt }) => {
        const isPreviousRound = eq(race.round, round - 1)
        const fiveDaysAgo = subDays(new Date(), 5)
        const gpIsNoMoreThanFiveAgo = gt(race.grandPrixDate, fiveDaysAgo)
        return and(isPreviousRound, gpIsNoMoreThanFiveAgo)
      },
    })
  }

  async function getNextRace(userId: string) {
    if (!currentUserGroup) {
      return
    }
    const cutoff = await getCutoff({ groupId: currentUserGroup, userId })
    if (cutoff === undefined) {
      return
    }
    return await db.query.racesTable.findFirst({
      where(race, { gt, or }) {
        const referenceDate = new Date()
        const cutoffDate = subMinutes(referenceDate, cutoff)

        // where tipping has started
        return or(
          gt(race.sprintQualifyingDate, cutoffDate),
          gt(race.qualifyingDate, cutoffDate),
        )
      },
    })
  }

  async function getOngoingRace(userId: string) {
    if (!currentUserGroup) {
      return
    }
    const cutoff = await getCutoff({ groupId: currentUserGroup, userId })
    if (cutoff === undefined) {
      return
    }

    const racesInFuture = await db.query.racesTable.findFirst({
      where(race, { gt, lt, and }) {
        const referenceDate = new Date()
        const cutoffDate = subMinutes(referenceDate, cutoff)

        const isAfterQualyCutoff = lt(race.qualifyingDate, cutoffDate)
        const isBeforeEndOfGrandPrixPlusDay = gt(
          race.grandPrixDate,
          subDays(referenceDate, 1),
        )
        return and(isAfterQualyCutoff, isBeforeEndOfGrandPrixPlusDay)
      },
      orderBy: (race) => race.round,
      columns: {
        id: true,
      },
    })
    return racesInFuture
  }

  async function getCutoffUncached(info: { groupId: string; userId: string }) {
    const { groupId, userId } = info
    const allGroupsOfUser = await db.query.groupMembersTable.findMany({
      where: (table, { eq }) => eq(table.userId, userId),
      with: {
        group: {
          columns: {
            cutoffInMinutes: true,
            id: true,
          },
        },
      },
    })
    return allGroupsOfUser.find((membership) => membership.group.id === groupId)
      ?.group.cutoffInMinutes
  }

  async function getIsUserInGroups(userId: string) {
    const groupsOfUser = await db.query.groupMembersTable.findMany({
      where: (group, { eq }) => eq(group.userId, userId),
      columns: {
        id: true,
      },
    })
    return !!groupsOfUser.length
  }

  function CardJoinGroup() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join or start a group</CardTitle>
          <CardDescription>
            You are not yet a member of a group. Get started tipping by joining
            or creating a group.
          </CardDescription>
        </CardHeader>
        <CardFooter className='mt-auto'>
          <Button asChild>
            <a href='/tipping/groups'>
              Manage groups
              <LucideArrowRight />
            </a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  async function CardPrevious(props: { race: Database.Race }) {
    const hasResults = await getHasResults(props.race.id)
    return (
      <Card>
        <RaceHeader
          race={props.race}
          title={props.race.raceName}
          description={'Round ' + props.race.round}
        />
        <CardContent>
          {!hasResults ? (
            <div className='space-y-2 max-w-prose'>
              <p>
                Usually results are available the{' '}
                <span className='font-medium'>
                  Monday after the race weekend
                </span>
                .
              </p>
              <p className='text-muted-foreground text-sm'>
                If it has been some time and you believe there could be an
                issue, feel free to get in touch.
              </p>
            </div>
          ) : (
            <p>Results are available. See how you did!</p>
          )}
        </CardContent>
        <CardFooter className='mt-auto'>
          {!hasResults ? (
            <Button asChild variant='link'>
              <Link href='/tipping/contact'>
                Contact us
                <LucideArrowRight />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href='/tipping/leaderboard'>
                View results
                <LucideArrowRight />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    )
    function getHasResults(id: string) {
      return db.query.resultsTable.findFirst({
        where: (result, { eq }) => eq(result.raceId, id),
      })
    }
  }

  type CardOngoingProps = { raceId: string; groupId: string }
  async function CardEveryonesTips(props: CardOngoingProps) {
    const predictionEntries = await getPredictionEntries()
    const positionToTips = reduceIntoObject(predictionEntries)

    const seenDriverMap = new Map<string, 'first' | 'second'>()
    const seenConstructors = new Set<string>()

    const race = await getRaceInfo(props.raceId)
    const positionTips = getTipsOnPosition()

    return (
      <Card>
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
            <p className='text-muted-foreground text-sm'>
              No one has tipped yet
            </p>
          </CardContent>
        )}
      </Card>
    )

    function TipsAccordion() {
      return (
        <CardContent>
          <Accordion
            type='single'
            collapsible={true}
            defaultValue={positionTips[0].position}
          >
            {positionTips.map(({ position, tips }) => {
              return (
                <React.Fragment key={position}>
                  <AccordionItem value={position}>
                    <AccordionTrigger>{getLabel(position)}</AccordionTrigger>
                    <AccordionContent className='space-y-2'>
                      {tips.map((tip) => {
                        return (
                          <TipRow
                            key={tip.id}
                            user={tip.user}
                            tip={tip.value}
                          />
                        )
                      })}
                    </AccordionContent>
                  </AccordionItem>
                </React.Fragment>
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

    function getRaceInfo(raceId: string) {
      return db.query.racesTable.findFirst({
        where: (race, { eq }) => eq(race.id, raceId),
        columns: {
          country: true,
          raceName: true,
        },
      })
    }

    function getLabel(position: RacePredictionField) {
      const positionToLabel: Record<RacePredictionField, string> = {
        pole: 'Pole position',
        p1: 'P1',
        p10: 'P10',
        last: 'Last position',
        constructorWithMostPoints: 'Constructor with most points',
        sprintP1: 'Sprint P1',
      }
      return positionToLabel[position]
    }

    function TipRow({
      tip,
      user,
    }: {
      user: (typeof predictionEntries)[number]['prediction']['user']
      tip:
        | (typeof predictionEntries)[number]['constructor']
        | (typeof predictionEntries)[number]['driver']
    }) {
      if (!tip) {
        return
      }
      const isDriver = 'constructorId' in tip
      const isCurrentUser = user.id === userId
      const style = isDriver
        ? getStyleForDriver(tip.id, tip.constructorId, false)
        : { ['--team-colour' as string]: getConstructorCssVariable(tip.id) }

      return (
        <div
          className={clsx(
            'flex items-center justify-between p-2 rounded-lg border',
            isCurrentUser && 'border-foreground/25',
            !isDriver && `bg-(--team-colour)/5`,
          )}
          style={style}
        >
          <div className='flex items-center gap-2 text-xs'>
            <UserAvatar
              name={user.name}
              id={user.id}
              className='size-6 rounded-lg'
            />
            <p className='text-muted-foreground'>{user.name}</p>
          </div>
          <div>
            {isDriver ? (
              <div className='flex items-baseline gap-1'>
                <p className='text-xs font-bold font-mono'>
                  {tip.permanentNumber}
                </p>

                <p>{tip.familyName}</p>
              </div>
            ) : (
              <Constructor constructor={tip} />
            )}
          </div>
        </div>
      )
    }

    function getStyleForDriver(
      driverId: string,
      constructorId: string,
      isCurrentUser: boolean,
    ): React.CSSProperties {
      if (!seenDriverMap.has(driverId)) {
        const isConstructorSeen = seenConstructors.has(constructorId)
        seenDriverMap.set(driverId, !isConstructorSeen ? 'first' : 'second')
        seenConstructors.add(constructorId)
      }
      const GRADIENT_CONFIG = {
        default: {
          start: 0.05,
          end: 0.2,
        },
        current: {
          start: 0.2,
          end: 0.4,
        },
      } as const

      const gradient = GRADIENT_CONFIG[isCurrentUser ? 'current' : 'default']
      const colourStart = getConstructorCssVariable(
        constructorId,
        gradient.start,
      )
      const colourEnd = getConstructorCssVariable(constructorId, gradient.end)
      const style = {
        backgroundImage: `linear-gradient(to ${seenDriverMap.get(driverId) === 'first' ? 'left' : 'right'}, ${colourStart} , ${colourEnd})`,
      }
      return style
    }

    function getPredictionEntries() {
      return db.query.predictionEntriesTable.findMany({
        where: inArray(
          predictionEntriesTable.predictionId,
          db
            .select({ id: predictionsTable.id })
            .from(predictionsTable)
            .where(
              and(
                eq(predictionsTable.groupId, props.groupId),
                eq(predictionsTable.raceId, props.raceId),
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
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
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

    function reduceIntoObject(entries: typeof predictionEntries) {
      type ReturnObject = Record<
        RacePredictionField,
        {
          id: string
          user: {
            name: string
            id: string
            image: string
          }
          position: RacePredictionField
          value:
            | (typeof predictionEntries)[number]['driver']
            | (typeof predictionEntries)[number]['constructor']
        }[]
      >

      const object = entries.reduce((acc, entry) => {
        const position = entry.position as RacePredictionField
        const mappedEntry = {
          id: entry.id,
          user: {
            name: entry.prediction.user.name,
            id: entry.prediction.user.id,
            image: getImageHref(entry.prediction.user),
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
          a.user.name.localeCompare(b.user.name),
        )
        acc[key as RacePredictionField] = items
        return acc
      }, {} as ReturnObject)

      return sorted
    }
  }
  function RaceHeader({
    title,
    race,
    description,
  }: {
    title: React.ReactNode
    race: Pick<Database.Race, 'country'>
    description?: React.ReactNode
  }) {
    return (
      <CardHeader className='flex gap-2 justify-between items-center'>
        <div className='flex flex-col gap-2'>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {race && <CountryFlag country={race.country} />}
      </CardHeader>
    )
  }
}

//     template(v-else)
//       .is-grid-card-fit.grid.gap-8
//         template(v-if='!allUserGroups?.length')
//           LazyCardJoinGroup
//         template(v-else)
//           template(v-if='ongoingRace')
//             div
//               LazyCardRaceTips(:race='ongoingRace')
//           template(v-if='previousRace')
//             LazyCardResults(:race='previousRace')
//           template(
//             v-if='championshipCutoffDate && isFuture(championshipCutoffDate)'
//           )
//             LazyCardTipChampionships(:cutoff-date='championshipCutoffDate')
//           template(v-if='nextRace')
//             LazyCardTipRace(:race='nextRace')
//             LazyCardTipStatus(:race='nextRace')
// </template>
//
