import { ClassValue } from 'clsx'
import {
  addDays,
  differenceInDays,
  differenceInHours,
  formatDistanceToNowStrict,
  isAfter,
  isBefore,
  isFuture,
  isPast,
  isWithinInterval,
  subDays,
  subMinutes,
} from 'date-fns'
import { eq } from 'drizzle-orm'
import { LucideArrowRight, LucideClock, LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { cache, ReactNode } from 'react'
import { Icon } from '@/components/icon'
import RaceTimes from '@/components/race-times'
import { TimeTile } from '@/components/time-tile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import UserAvatar from '@/components/user-avatar'
import { GLOBAL_GROUP_ID } from '@/constants/group'
import { db } from '@/db'
import { groupMembersTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { cn } from '@/lib/utils'
import { getCountryFlag } from '@/lib/utils/country-flag'
import {
  getCurrentGroupId,
  getFirstRace,
  getGroupMembers,
  getGroupMembership,
} from '@/lib/utils/groups'
import { getIsSprint, getDueDatesForTips } from '@/lib/utils/prediction-fields'
import ChampionshipImage from '@/public/img/championship.jpg'
import CopyLink from './groups/_components/copy-link'
import { getRaces } from '@/lib/utils/races'
import { FlagBackgroundCard } from './_components/card-flag-background'
import { CardEveryonesTips } from './_components/card-group-tips'
import { RaceHeader } from './_components/race-header'

export default async function DashboardPage() {
  const { userId, user: _ } = await verifySession()
  const currentUserGroup = await getCurrentGroupId()

  const getCutoff = cache(getCutoffUncached)
  const [
    hasGroups,
    ongoingRaceWithOffset,
    ongoingRaceStrict,
    nextRace,
    firstRace,
  ] = await Promise.all([
    getIsUserInGroups(userId),
    getOngoingRace(userId, { plusDay: 1 }),
    getOngoingRace(userId, { plusDay: 0 }),
    getNextRace(userId),
    getFirstRace(),
  ])
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
    const membership = await getGroupMembership({ groupId, userId })
    const groupMembers = await getGroupMembers(groupId)

    if (!membership) {
      return <CardJoinGroup />
    }

    const isGlobalGroup = groupId === GLOBAL_GROUP_ID

    const showInviteCard = groupMembers.length < 2 && !isGlobalGroup

    const showChampionshipCard =
      group.championshipTipsRevalDate &&
      isPast(group.championshipTipsRevalDate) &&
      isWithinInterval(new Date(), {
        start: group.championshipTipsRevalDate,
        end: addDays(group.championshipTipsRevalDate, 3),
      })

    const showTipChampionshipsCard =
      firstRace?.qualifyingDate && isFuture(firstRace.qualifyingDate)

    return (
      <>
        {showInviteCard && <CardInviteGroup group={group} />}
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
        {showTipChampionshipsCard && (
          <CardTipChampionships deadline={firstRace.qualifyingDate} />
        )}
        {shouldShouldShowOngoingCards && (
          <>
            <CardTipNext
              memberId={membership.id}
              race={nextRace}
              groupId={groupId}
            />
            {!isGlobalGroup && (
              <CardTipStatus groupId={groupId} race={nextRace} />
            )}
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
              <MemberList title='Tipped' Icon={Icon.Tipping} members={tipped} />
            )}
            {notTipped.length > 0 && (
              <MemberList
                title='Yet To Tip'
                Icon={LucideClock}
                members={notTipped}
              />
            )}
          </div>
        </CardContent>
      </Card>
    )

    function MemberList({
      title,
      Icon,
      members: members,
    }: {
      members: Array<
        Pick<Database.GroupMember, 'id' | 'userName' | 'profileImage'>
      >
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
              {members.map((member) => (
                <div key={member.id} className='flex items-center gap-2'>
                  <UserAvatar
                    className='size-6 rounded-lg'
                    profileImageUrl={member.profileImage}
                    name={member.userName}
                  />
                  <p className='text-sm'>{member.userName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    async function getTippingStatus() {
      const groupMembers = await db.query.groupMembersTable.findMany({
        where: (group, { eq }) => eq(group.groupId, groupId),
        columns: {
          id: true,
          userName: true,
          profileImage: true,
        },
      })

      const peopleWhoTippedThisRace = await db.query.predictionsTable.findMany({
        where: (prediction, { eq, and }) =>
          and(eq(prediction.groupId, groupId), eq(prediction.raceId, race.id)),
        columns: {
          id: true,
        },
        with: {
          member: {
            columns: {
              id: true,
            },
          },
        },
      })

      const tippersSet = new Set(
        peopleWhoTippedThisRace.map((p) => p.member.id),
      )

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
    memberId,
  }: {
    race: Database.Race
    groupId: Database.Group['id']
    memberId: Database.GroupMemberId
  }) {
    const cutoff = await getCutoff({ groupId: groupId, userId })
    if (cutoff === undefined) {
      return
    }
    const isSprint = getIsSprint(race)
    const tipsDue = getDueDatesForTips(race, cutoff)
    const hasTipped = await getHasTipped()

    return (
      <FlagBackgroundCard race={race}>
        <RaceHeader
          race={race}
          title={
            <span className='flex flex-col gap-3'>
              <div className='flex flex-row flex-wrap gap-y-1 gap-x-2'>
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

    async function getHasTipped() {
      return !!(await db.query.predictionsTable.findFirst({
        where: (prediction, { eq, and }) =>
          and(
            eq(prediction.memberId, memberId),
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
    const cutoffInMinutes = await getCutoff({
      groupId: currentUserGroup,
      userId,
    })
    if (cutoffInMinutes === undefined) {
      return
    }

    const allRaces = await getRaces()
    const now = new Date()

    const ongoingRaces = allRaces
      .filter((race) => {
        const cutoffDate = subMinutes(race.qualifyingDate, cutoffInMinutes)
        const isAfterQualyCutoff = isAfter(now, cutoffDate)
        const isBeforeEndOfGrandPrixWithCustomExtension = isBefore(
          now,
          addDays(race.grandPrixDate, config.plusDay),
        )

        return isAfterQualyCutoff && isBeforeEndOfGrandPrixWithCustomExtension
      })
      .sort((a, b) => a.round - b.round)

    return ongoingRaces[0]
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
            name: true,
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

function CardInviteGroup({
  group,
}: {
  group: Pick<Database.Group, 'id' | 'name'>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite your friends</CardTitle>
        <CardDescription>
          F1 is better with your friends. Send them an invite link to your
          group.
        </CardDescription>
      </CardHeader>
      <CardFooter className='mt-auto'>
        <CopyLink group={group} />
      </CardFooter>
    </Card>
  )
}

function CardTipChampionships({ deadline }: { deadline: Date }) {
  return (
    <BackgroundCard
      blur='blur-2xl'
      image={
        <Image
          src={ChampionshipImage}
          height={150}
          width={100}
          className='w-full h=full'
          alt=''
        />
      }
    >
      <CardHeader className='flex gap-2 justify-between items-center'>
        <div className='flex flex-col gap-2'>
          <CardTitle>
            {' '}
            <span className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <Badge variant={getBadgeVariant(deadline)}>
                  Due in {formatDistanceToNowStrict(deadline)}
                </Badge>
              </div>
              <span>Tip Championships</span>
            </span>
          </CardTitle>
          <CardDescription>
            Predict the Driver’s and Constructor’s championships for extra
            points
          </CardDescription>
        </div>
        <Image
          src={ChampionshipImage}
          height={300}
          width={200}
          className='size-12 overflow-hidden object-cover rounded-full border-2'
          alt='Golden trophy in front of a wheel'
        />
      </CardHeader>
      <CardContent className='flex'>
        <TimeTile
          title='Tips due'
          date={new Date(deadline)}
          icon='Tipping'
          isActive={true}
        />
      </CardContent>
      <CardFooter className='mt-auto'>
        <Button asChild>
          <Link href={`/tipping/championships`}>
            Predict championships
            <LucideArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </BackgroundCard>
  )
}

function BackgroundCard({
  image,
  children,
  blur,
  gradient,
}: {
  image: ReactNode
  blur?: ClassValue
  gradient?: string
  children: ReactNode
}) {
  return (
    <Card className='relative isolate overflow-hidden'>
      <div
        className={cn('absolute inset-0 overflow-hidden z-[-1] blur-3xl', blur)}
      >
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-card/85 to-card',
            gradient,
          )}
        />
        {image}
      </div>
      {children}
    </Card>
  )
}

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
