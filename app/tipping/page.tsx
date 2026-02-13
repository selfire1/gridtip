import { Button } from '@/components/ui/button'
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
import {
  groupMembersTable,
  predictionEntriesTable,
  predictionsTable,
} from '@/db/schema/schema'
import { verifySession } from '@/lib/dal'
import { getCurrentGroupId } from '@/lib/utils/groups'
import {
  subDays,
  subMinutes,
  formatDistanceToNowStrict,
  differenceInHours,
  isFuture,
  differenceInDays,
  isWithinInterval,
  addDays,
  isPast,
} from 'date-fns'
import { and, eq, inArray } from 'drizzle-orm'
import { LucideArrowRight, LucideClock, LucideIcon } from 'lucide-react'
import React, { cache, ReactNode } from 'react'
import UserAvatar from '@/components/user-avatar'
import clsx from 'clsx'
import Constructor from '@/components/constructor'
import CountryFlag from '@/components/country-flag'
import { Database } from '@/db/types'
import Link from 'next/link'
import RaceTimes from '@/components/race-times'
import {
  getIsSprint,
  getLabel,
  getTipsDue,
} from '@/lib/utils/prediction-fields'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/icon'
import { getCountryFlag } from '@/lib/utils/country-flag'
import { cn } from '@/lib/utils'
import { getConstructorCssVariable } from '@/lib/utils/constructor-css'

export default async function DashboardPage() {
  const { userId, user } = await verifySession()
  const currentUserGroup = await getCurrentGroupId()

  const getCutoff = cache(getCutoffUncached)
  const hasGroups = await getIsUserInGroups(userId)
  const ongoingRaceWithOffset = await getOngoingRace(userId, { plusDay: 1 })
  const ongoingRaceStrict = await getOngoingRace(userId, { plusDay: 0 })
  const nextRace = await getNextRace(userId)
  const previousRace = await getPreviousRace(nextRace?.round)

  const shouldShowPrevious = !ongoingRaceStrict && previousRace
  const shouldShouldShowOngoingCards = !ongoingRaceStrict && nextRace

  const hasOngoingWithOffsetResults = !ongoingRaceWithOffset
    ? false
    : await getHasResults(ongoingRaceWithOffset.id)

  const currentGroup = await getCurrentGroupInfo(userId)

  return (
    <div className='is-grid-card-fit grid gap-8 is-bg-muted'>
      {(!hasGroups || !currentUserGroup) && <CardJoinGroup />}
      {currentUserGroup && currentGroup && (
        <RequiresGroup groupId={currentUserGroup} group={currentGroup} />
      )}
    </div>
  )

  async function RequiresGroup({
    groupId,
    group,
  }: {
    groupId: string
    group: NonNullable<Awaited<ReturnType<typeof getCurrentGroupInfo>>>
  }) {
    const showChampionshipCard =
      group.championshipTipsRevalDate &&
      isPast(group.championshipTipsRevalDate) &&
      isWithinInterval(new Date(), {
        start: group.championshipTipsRevalDate,
        end: addDays(group.championshipTipsRevalDate, 3),
      })

    return (
      <>
        {shouldShowPrevious &&
          getPreviousRaceStatus(previousRace) === 'current' && (
            <CardPreviousRaceResults race={previousRace} isActive />
          )}
        {ongoingRaceWithOffset && (
          <CardEveryonesTips
            raceId={ongoingRaceWithOffset.id}
            groupId={groupId}
            collapsed={hasOngoingWithOffsetResults}
          />
        )}
        {shouldShouldShowOngoingCards && (
          <>
            <CardTipNext race={nextRace} groupId={groupId} />
            <CardTipStatus groupId={groupId} race={nextRace} />
          </>
        )}
        {showChampionshipCard && <CardChampionshipTips />}
        {shouldShowPrevious &&
          getPreviousRaceStatus(previousRace) === 'past' && (
            <CardPreviousRaceResults race={previousRace} isActive={false} />
          )}
      </>
    )
  }

  function getPreviousRaceStatus(race: Pick<Database.Race, 'grandPrixDate'>) {
    const daysAgo = differenceInDays(race.grandPrixDate, new Date())
    if (daysAgo <= 3) {
      return 'current'
    }
    return 'past'
  }

  async function CardTipStatus({
    groupId,
    race,
  }: {
    groupId: Database.Group['id']
    race: Pick<Database.Race, 'id' | 'raceName'>
  }) {
    const { tipped, notTipped } = await getTippingStatus()
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipping status</CardTitle>
          <CardDescription>
            Who has tipped the{' '}
            <span className='font-medium'>{race.raceName}</span> already?
          </CardDescription>
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
      users: Array<Pick<Database.User, 'id' | 'name' | 'profileImageUrl'>>
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
                  <UserAvatar className='size-6 rounded-lg' {...user} />
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
                profileImageUrl: true,
              },
            },
          },
        })
      ).map((groupMember) => groupMember.user)

      const peopleWhoTippedThisRace = await db.query.predictionsTable.findMany({
        where: (prediction, { eq, and }) =>
          and(eq(prediction.groupId, groupId), eq(prediction.raceId, race.id)),
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
      <FlagBackgroundCard race={race}>
        <RaceHeader
          race={race}
          title={
            <span className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                {isSprint && tipsDue.sprint && isFuture(tipsDue.sprint) && (
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
            <div className='flex flex-wrap gap-y-0 items-center gap-x-2'>
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
      </FlagBackgroundCard>
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

  async function getOngoingRace(
    userId: string,
    config: {
      plusDay: number
    },
  ) {
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
          subDays(referenceDate, config.plusDay),
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

  async function CardPreviousRaceResults({
    race,
    isActive = true,
  }: {
    race: Database.Race
    isActive?: boolean
  }) {
    const hasResults = await getHasResults(race.id)
    return (
      <Card className='relative isolate overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden z-[-1] blur-3xl'>
          <div className='absolute inset-0 bg-gradient-to-br from-card/85 to-card' />
          <img alt='' src={getCountryFlag(race.country)} />
        </div>
        <RaceHeader
          race={race}
          title={race.raceName}
          description={'Round ' + race.round}
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
            <Button asChild variant={isActive ? 'default' : 'outline'}>
              <Link href='/tipping/leaderboard'>
                View results
                <LucideArrowRight />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  type CardOngoingProps = {
    raceId: string
    groupId: string
    collapsed?: boolean
  }
  async function CardEveryonesTips(props: CardOngoingProps) {
    const predictionEntries = await getPredictionEntries()
    const positionToTips = reduceIntoObject(predictionEntries)

    const seenDriverMap = new Map<string, 'first' | 'second'>()
    const seenConstructors = new Set<string>()

    const race = await getRaceInfo(props.raceId)
    const positionTips = getTipsOnPosition()

    const usersByTip = getUsersByTip(positionTips)

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
            <p className='text-muted-foreground text-sm'>
              No one has tipped yet
            </p>
          </CardContent>
        )}
      </FlagBackgroundCard>
    )

    function getUsersByTip(entries: typeof positionTips) {
      return entries.map(({ position, tips }) => {
        const tipsByValue = tips.reduce(
          (acc, tip) => {
            const { value, user } = tip
            if (!value) {
              return acc
            }
            const exists = acc.find((accTip) => accTip.tip.id === value.id)
            if (exists) {
              exists.users.push(user)
              return acc
            }
            acc.push({ tip: value, users: [user] })
            return acc
          },
          [] as Array<{
            tip: NonNullable<
              (typeof positionTips)[number]['tips'][number]['value']
            >
            users: Array<
              (typeof predictionEntries)[number]['prediction']['user']
            >
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
            defaultValue={
              props.collapsed ? undefined : positionTips[0].position
            }
          >
            {usersByTip.map(({ position, tipsByValue }) => {
              return (
                <AccordionItem key={position} value={position}>
                  <AccordionTrigger>{getLabel(position)}</AccordionTrigger>
                  <AccordionContent className='space-y-4'>
                    {tipsByValue.map(({ tip, users }) => {
                      return (
                        <TipRowByUser key={tip.id} users={users} tip={tip} />
                      )
                    })}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
            {
              // {positionTips.map(({ position, tips }) => {
              //   return (
              //     <React.Fragment key={position}>
              //       <AccordionItem value={position}>
              //         <AccordionTrigger>{getLabel(position)}</AccordionTrigger>
              //         <AccordionContent className='space-y-2'>
              //           {tips.map((tip) => {
              //             return (
              //               <TipRow
              //                 key={tip.id}
              //                 user={tip.user}
              //                 tip={tip.value}
              //               />
              //             )
              //           })}
              //         </AccordionContent>
              //       </AccordionItem>
              //     </React.Fragment>
              //   )
              // })}
            }
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
      users,
    }: {
      users: (typeof predictionEntries)[number]['prediction']['user'][]
      tip:
        | (typeof predictionEntries)[number]['constructor']
        | (typeof predictionEntries)[number]['driver']
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
            ...getStyleForDriver(tip.id, tip.constructorId, false),
          }
        : {}

      return (
        <div className='bg-background/50 overflow-hidden rounded-lg border'>
          <div
            className={clsx(
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
          <div className='space-y-3 p-3'>
            {users.map((user) => (
              <div
                className={cn(
                  'flex items-center gap-2',
                  user.id === userId && 'font-semibold',
                )}
                key={user.id}
              >
                <UserAvatar {...user} className='size-6 rounded-lg' />
                <p>{user.name}</p>
              </div>
            ))}
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
          start: 0.01,
          end: 0.1,
        },
        current: {
          start: 0.2,
          end: 0.4,
        },
      } as const

      const gradient = GRADIENT_CONFIG[isCurrentUser ? 'current' : 'default']
      const colourStart = getConstructorCssVariable(constructorId, {
        opacity: gradient.start,
      })
      const colourEnd = getConstructorCssVariable(constructorId, {
        opacity: gradient.end,
      })
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
                  profileImageUrl: true,
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
            profileImageUrl: string
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
            profileImageUrl: user.profileImageUrl,
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

  function FlagBackgroundCard({
    race,
    children,
  }: {
    race: Pick<Database.Race, 'country'> | undefined
    children: ReactNode
  }) {
    return (
      <Card className='relative isolate overflow-hidden'>
        {race && (
          <div className='absolute inset-0 overflow-hidden z-[-1] blur-3xl'>
            <div className='absolute inset-0 bg-gradient-to-br from-card/85 to-card' />
            <img alt='' src={getCountryFlag(race.country)} />
          </div>
        )}
        {children}
      </Card>
    )
  }

  function CardChampionshipTips() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Championship Tips Revealed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            See what everyone in your group predicted for the driver and
            constructor championships.
          </p>
        </CardContent>
        <CardFooter className='mt-auto'>
          <Button asChild>
            <Link href='/tipping/championships'>
              View championship tips
              <LucideArrowRight />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  async function getCurrentGroupInfo(userId: string) {
    const cookieGroupId = await getCurrentGroupId()
    if (!cookieGroupId) {
      return
    }
    const userWithGroups = await db.query.groupMembersTable.findMany({
      columns: {
        joinedAt: true,
      },
      where: eq(groupMembersTable.userId, userId),
      with: {
        group: {
          columns: {
            id: true,
            championshipTipsRevalDate: true,
          },
        },
      },
    })
    return userWithGroups.find(({ group }) => group.id === cookieGroupId)?.group
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
async function getHasResults(id: string) {
  return cache(
    async () =>
      !!(await db.query.resultsTable.findFirst({
        where: (result, { eq }) => eq(result.raceId, id),
        columns: {
          id: true,
        },
      })),
  )()
}
