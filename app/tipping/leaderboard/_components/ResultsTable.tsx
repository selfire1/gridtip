import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import UserAvatar from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideArrowDown, LucideArrowUp, LucideMinus } from 'lucide-react'
import { ClassValue } from 'clsx'
import { Group } from '@/db/schema/schema'

import { db } from '@/db'
import { getImageHref } from '@/lib/utils/user'
import { LucideListX } from 'lucide-react'
import Alert from '@/components/alert'
import { Database } from '@/db/types'
import {
  getRaceIdToResultMap,
  getOnlyRacesWithResults,
  ResultsMap,
  getPredictionsOfRacesAfterCutoff,
} from '@/lib/utils/race-results'
import { Card, CardContent } from '@/components/ui/card'
import { getGroupMembers } from '@/lib/utils/groups'

type Leaderboard = {
  place: number
  user: Pick<Database.User, 'id' | 'name' | 'image'>
  points: number
  delta: number | null
  pointsDelta: number | null
}[]

type Row = Leaderboard[number]
export async function ResultsTable({ groupId }: { groupId: Group['id'] }) {
  const allPredictions = await getPredictionsOfRacesAfterCutoff(groupId)
  const groupMembers = await getGroupMembers(groupId)
  const resultsByRaceAndPosition = await getRaceIdToResultMap()
  const racesWithResults = await getOnlyRacesWithResults()
  const leaderboard = getLeaderboardInfo()

  if (!leaderboard.length) {
    return <Alert icon={LucideListX} title='Leaderboard is empty' />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Place</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Delta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaderboard.map((row) => (
          <TableRow key={row.user.id}>
            <TableCell>
              <PlaceBadge place={row.place} className='min-w-10' />
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <UserAvatar {...row.user} className='h-8 w-8 rounded-lg' />
                <p className='text-muted-foreground'> {row.user.name}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary' className='tabular-nums'>
                  {row.points}
                </Badge>
                <PointsDelta delta={row.pointsDelta} />
              </div>
            </TableCell>
            <TableCell>
              <PositionDelta delta={row.delta} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  function getLeaderboardInfo() {
    if (
      !resultsByRaceAndPosition ||
      !allPredictions.length ||
      !groupMembers.length
    ) {
      console.warn('No results for leaderboard.')
      return []
    }
    const lastRace = racesWithResults?.[0]
    return getLeaderboard(
      resultsByRaceAndPosition,
      allPredictions,
      groupMembers,
      {
        previousRaceId: lastRace?.id,
      },
    )
  }

  function getLeaderboard(
    resultsMap: ResultsMap,
    localAllPredictions: typeof allPredictions,
    localMembersOfGroup: typeof groupMembers,
    options?: {
      previousRaceId?: Database.Race['id']
    },
  ): Leaderboard {
    if (
      !localMembersOfGroup?.length ||
      !resultsMap ||
      !localAllPredictions?.length
    ) {
      return []
    }
    let memberToPreviousPositionMap = new Map<
      Database.User['id'],
      { position: number; points: number }
    >()
    const previousRaceId = options?.previousRaceId
    if (previousRaceId) {
      const clonedResultsMap = new Map(resultsMap)
      clonedResultsMap.delete(previousRaceId)
      const previousLeaderboard = getLeaderboard(
        clonedResultsMap,
        localAllPredictions.filter(
          (prediction) => prediction.raceId !== previousRaceId,
        ),
        localMembersOfGroup,
      )

      const previousPositions = getPositionArray(previousLeaderboard)
      previousLeaderboard.forEach((entry) => {
        memberToPreviousPositionMap.set(entry.user.id, {
          position: previousPositions.indexOf(entry.points),
          points: entry.points,
        })
      })
    }
    const membersMap = localMembersOfGroup.reduce((map, user) => {
      map.set(user.id, {
        ...user,
        image: getImageHref(user),
        points: 0,
        delta: null,
        pointsDelta: null,
      })
      return map
    }, new Map<Database.User['id'], Pick<Database.User, 'id' | 'name' | 'image'> & { points: number; delta: Leaderboard[number]['delta']; pointsDelta: Leaderboard[number]['pointsDelta'] }>())
    if (!resultsMap) {
      console.warn('No results')
      return []
    }

    const increaseUserPoints = (userId: Database.User['id']) => {
      if (!membersMap?.has(userId)) {
        return
      }
      const currentValue = membersMap.get(userId)
      if (!currentValue) {
        return
      }
      membersMap.set(userId, {
        ...currentValue,
        points: currentValue.points + 1,
      })
    }

    localAllPredictions.forEach(
      ({
        position: predictedPosition,
        driverId: predictedDriverId,
        constructorId,
        raceId,
        userId,
      }) => {
        if (!raceId) {
          console.warn('No race id')
          return
        }
        const raceResults = resultsMap.get(raceId)
        if (!raceResults) {
          console.info('No results found for race')
          return
        }
        if (predictedPosition === 'constructorWithMostPoints') {
          if (!constructorId) {
            return
          }
          const isCorrect = raceResults.topConstructorsPoints.has(constructorId)
          if (!isCorrect) {
            return
          }
          increaseUserPoints(userId)
          return
        }
        if (predictedPosition === 'sprintP1' && raceResults.sprint) {
          const tip = predictedDriverId
          const result = raceResults.sprint.get(1)
          const isCorrect = tip === result?.id
          if (!isCorrect) return
          increaseUserPoints(userId)
        }
        const result = (() => {
          switch (predictedPosition) {
            case 'p1':
              return raceResults.gp.get(1)
            case 'pole':
              return raceResults.qualifying.get(1)
            case 'p10':
              return raceResults.gp.get(10)
            case 'last':
              const sorted = [...raceResults.gp.entries()].sort(
                (a, b) => (a[0] || Infinity) - (b[0] || Infinity),
              )
              const [lastPlacePosition] = sorted.at(-1) ?? [1]
              return raceResults.gp.get(lastPlacePosition)
          }
        })()
        if (!result) {
          return
        }
        const isCorrect = result.id === predictedDriverId
        if (!isCorrect) {
          return
        }
        increaseUserPoints(userId)
      },
    )

    if (!membersMap) {
      return []
    }

    const leaderboardArray = [...membersMap.entries()]
      .map(([_userId, userInfo]) => {
        const { points, delta, pointsDelta, ...info } = userInfo
        return { points, delta, pointsDelta, user: info }
      })
      .sort(
        (a, b) => b.points - a.points || a.user.name.localeCompare(b.user.name),
      )
    const positionArray = getPositionArray(leaderboardArray)

    const leaderboard = leaderboardArray.reduce((acc, entry) => {
      const currentPosition = positionArray.indexOf(entry.points)
      const previousPosition = memberToPreviousPositionMap.size
        ? memberToPreviousPositionMap.get(entry.user.id)
        : null

      let { points: pointsDelta, position: delta } = getDelta(
        previousPosition,
        currentPosition,
        entry.points,
      )

      acc.push({ place: getPlace(entry.points), ...entry, delta, pointsDelta })
      return acc

      function getDelta(
        prev: typeof previousPosition,
        currentPos: typeof currentPosition,
        points: number,
      ) {
        if (prev === undefined || prev === null || prev.position === -1) {
          return {
            points: null,
            position: null,
          }
        }
        return {
          points: points - prev.points,
          position: prev.position - currentPos,
        }
      }

      function getPlace(points: number) {
        return positionArray.indexOf(points) + 1
      }
    }, [] as Leaderboard)
    return leaderboard
  }

  function getPositionArray(
    leaderboard: Array<Omit<Leaderboard[number], 'place'>>,
  ) {
    return leaderboard.reduce((acc, entry) => {
      if (acc.includes(entry.points)) {
        return acc
      }
      acc.push(entry.points)
      return acc
    }, [] as number[])
  }

  function PositionDelta({ delta }: { delta: Row['pointsDelta'] }) {
    if (delta === null) {
      return
    }

    const { string, className, icon: Icon } = getInfo(delta)
    return (
      <span
        className={cn(
          className,
          'border-transparent flex items-center gap-0.5 tabular-nums text-xs',
        )}
      >
        <Icon size={12} />
        {string}
      </span>
    )

    function getInfo(delta: number) {
      if (delta === 0) {
        return {
          string: undefined,
          className: 'text-muted-foreground/50',
          icon: LucideMinus,
        }
      }
      if (delta < 0) {
        return {
          string: delta,
          className: 'text-destructive',
          icon: LucideArrowDown,
        }
      }
      return {
        string: delta,
        className: 'text-success',
        icon: LucideArrowUp,
      }
    }
  }

  function PointsDelta({ delta }: { delta: Row['pointsDelta'] }) {
    if (delta === null) {
      return
    }

    const { string, className } = getInfo(delta)
    return (
      <Badge
        variant='outline'
        className={cn(
          className,
          'border-transparent',
          'tabular-nums',
          'min-w-8',
        )}
      >
        {string}
      </Badge>
    )

    function getInfo(delta: number): { string: string; className: ClassValue } {
      if (delta === 0) {
        return {
          string: '0',
          className: 'text-muted-foreground/50',
          // icon: LucideMinus,
        }
      }
      if (delta < 0) {
        return {
          string: `-${delta}`,
          className: 'text-destructive',
          // icon: LucideArrowDown,
        }
      }
      return {
        string: `+${delta}`,
        className: 'text-success',
        // icon: LucideArrowUp,
      }
    }
  }

  function PlaceBadge({
    place,
    className,
  }: {
    place: Row['place']
    className?: string
  }) {
    const placeString = place + '.'
    switch (place) {
      case 1:
        return (
          <Badge variant='outline' className={cn(className, 'text-2xl shadow')}>
            🥇
          </Badge>
        )
      case 2:
        return (
          <Badge
            className={cn(className, 'text-base shadow-xs')}
            variant='outline'
          >
            🥈
          </Badge>
        )
      case 3:
        return (
          <Badge
            className={cn(className, 'text-sm shadow-2xs')}
            variant='outline'
          >
            🥉
          </Badge>
        )

      default:
        return (
          <Badge className={cn(className, 'text-xs')} variant='outline'>
            {placeString}
          </Badge>
        )
    }
  }
}
