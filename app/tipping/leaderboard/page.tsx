import Alert from '@/components/alert'
import { db } from '@/db'
import {
  groupsTable,
  predictionEntriesTable,
  predictionsTable,
  racesTable,
} from '@/db/schema/schema'
import { Database } from '@/db/types'
import { verifySession } from '@/lib/dal'
import { getCurrentGroupId } from '@/lib/utils/groups'
import { subMinutes } from 'date-fns'
import { eq, lt, and, inArray } from 'drizzle-orm'
import { Metadata } from 'next'
import { DriverOption } from '../components/select-driver'
import { getImageHref } from '@/lib/utils/user'
import { LucideAlertCircle, LucideListX } from 'lucide-react'
import { ResultsTable } from './_components/ResultsTable'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Leaderboard',
}

export type Leaderboard = {
  place: number
  user: Pick<Database.User, 'id' | 'name' | 'image'>
  points: number
  delta: number | null
  pointsDelta: number | null
}[]

export default async function LeaderboardPage() {
  await verifySession()
  const groupId = await getCurrentGroupId()
  if (!groupId) {
    return <Alert title='No group found' />
  }
  const idsOfRacesAfterCutoff = await getRacesThatAreAfterCutoff(groupId)
  const allPredictions = await getPredictionsOfRaces(
    groupId,
    idsOfRacesAfterCutoff,
  )
  const groupMembers = await getGroupMembers(groupId)
  const dbResults = await getResults()
  const resultsByRaceAndPosition = getMapFromResults(dbResults)
  const racesWithResults = await getRacesWithResults()
  const leaderboard = getLeaderboardInfo()

  if (!leaderboard.length) {
    return <Alert icon={LucideListX} title='Leaderboard is empty' />
  }

  return (
    <>
      <ResultsTable leaderboard={leaderboard} />
    </>
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
          position: currentPos - prev.position,
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

  async function getRacesWithResults() {
    const allRaces = await db.query.racesTable.findMany({
      columns: {
        id: true,
        round: true,
      },
    })
    return allRaces
      ?.filter((race) => resultsByRaceAndPosition?.has(race.id))
      ?.sort((a, b) => b.round - a.round)
  }

  async function getResults() {
    return await db.query.resultsTable.findMany({
      with: {
        driver: {
          columns: {
            id: true,
            constructorId: true,
            givenName: true,
            familyName: true,
          },
        },
        constructor: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    })
  }

  type Position = number
  type ResultsMap = Map<
    /**
     * The id of the race
     */
    Database.Race['id'],
    {
      qualifying: Map<Position, DriverOption>
      sprint: Map<Position, DriverOption> | null
      gp: Map<Position, DriverOption>
      allConstructorsPoints: Map<Database.Result['constructorId'], number>
      topConstructorsPoints: Map<Database.Result['constructorId'], number>
    }
  >

  function getMapFromResults(
    results: typeof dbResults,
  ): ResultsMap | undefined {
    if (!results?.length) {
      return
    }

    const resultsMap: ResultsMap = new Map()
    results.forEach((result) => {
      const isRaceInMap = resultsMap.has(result.raceId)
      const hasSprintResult = result.sprint

      if (!isRaceInMap) {
        resultsMap.set(result.raceId, {
          allConstructorsPoints: new Map<Database.Constructor['id'], number>(),
          topConstructorsPoints: new Map<Database.Constructor['id'], number>(),
          qualifying: new Map<number, DriverOption>(),
          gp: new Map<number, DriverOption>(),
          sprint: hasSprintResult ? new Map<number, DriverOption>() : null,
        })
      }

      const raceMap = resultsMap.get(result.raceId)!
      if (result.driver) {
        raceMap.qualifying.set(result.grid ?? 0, result.driver)
      } else {
        console.warn('No driver for `grid`', result)
      }

      if (result.driver) {
        if (result.position && result.position > 0) {
          raceMap.gp.set(result.position, result.driver)
        }
      } else {
        console.warn('No driver for `position`', result)
      }

      if (result.sprint && result.sprint > 0) {
        if (!raceMap?.sprint) {
          raceMap.sprint = new Map<number, DriverOption>()
        }

        if (result.driver) {
          raceMap.sprint.set(result.sprint, result.driver ?? {})
        } else {
          console.warn('No driver for `sprint`', result)
        }
      }

      const constructorsMap = raceMap!.allConstructorsPoints
      if (!constructorsMap.has(result.constructorId)) {
        constructorsMap.set(result.constructorId, 0)
      }
      const currentConstructorPoints =
        constructorsMap.get(result.constructorId)! + result.points
      constructorsMap.set(result.constructorId, currentConstructorPoints)

      const topConstructors = raceMap!.topConstructorsPoints

      const currentMaxPoints = Math.max(...constructorsMap.values())
      if (currentConstructorPoints >= currentMaxPoints) {
        topConstructors.set(result.constructorId, currentConstructorPoints)
        topConstructors.forEach((value, key) => {
          if (value < currentConstructorPoints) {
            topConstructors.delete(key)
          }
        })
      }
    })
    return resultsMap
  }

  async function getGroupMembers(groupId: string) {
    return (
      await db.query.groupMembersTable.findMany({
        where: (member, { eq }) => eq(member.groupId, groupId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      })
    ).map((member) => member.user)
  }

  async function getPredictionsOfRaces(groupId: string, ids: string[]) {
    const predictionEntries = await db
      .select({
        id: predictionEntriesTable.id,
        userId: predictionsTable.userId,
        raceId: predictionsTable.raceId,
        position: predictionEntriesTable.position,
        driverId: predictionEntriesTable.driverId,
        constructorId: predictionEntriesTable.constructorId,
      })
      .from(predictionsTable)
      .leftJoin(
        predictionEntriesTable,
        eq(predictionsTable.id, predictionEntriesTable.predictionId),
      )
      .where(
        and(
          eq(predictionsTable.groupId, groupId),
          inArray(predictionsTable.raceId, ids),
        ),
      )
    return predictionEntries
  }

  async function getRacesThatAreAfterCutoff(groupId: string) {
    const group = await db.query.groupsTable.findFirst({
      where: eq(groupsTable.id, groupId),
      columns: {
        cutoffInMinutes: true,
      },
    })

    const cutoffInMinutes = group?.cutoffInMinutes
    if (cutoffInMinutes === undefined) {
      throw new Error('Group not found')
    }
    const currentDate = new Date()
    const currentDateWithCutoffAdjusted = subMinutes(
      currentDate,
      cutoffInMinutes,
    )
    const raceIds = (
      await db.query.racesTable.findMany({
        where: lt(racesTable.qualifyingDate, currentDateWithCutoffAdjusted),
        columns: {
          id: true,
        },
      })
    ).map((race) => race.id)
    return raceIds
  }
}
