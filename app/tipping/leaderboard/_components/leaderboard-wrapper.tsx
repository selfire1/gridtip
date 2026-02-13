import { Group } from '@/db/schema/schema'

import { LucideListX } from 'lucide-react'
import Alert from '@/components/alert'
import { Database } from '@/db/types'
import {
  getRaceIdToResultMap,
  getOnlyRacesWithResults,
  ResultsMap,
  getPredictionsOfRacesAfterCutoff,
} from '@/lib/utils/race-results'
import { getGroupMembers } from '@/lib/utils/groups'
import { Leaderboard, LeaderBoard } from './leaderboard'

export async function LeaderboardWrapper({
  groupId,
}: {
  groupId: Group['id']
}) {
  const allPredictions = await getPredictionsOfRacesAfterCutoff(groupId)
  const groupMembers = await getGroupMembers(groupId)
  const resultsByRaceAndPosition = await getRaceIdToResultMap()
  const racesWithResults = await getOnlyRacesWithResults()
  const leaderboard = getLeaderboardInfo()

  if (!leaderboard.length) {
    return <Alert icon={LucideListX} title='Leaderboard is empty' />
  }

  return <LeaderBoard leaderboard={leaderboard} />

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
    const memberToPreviousPositionMap = new Map<
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
        memberToPreviousPositionMap.set(entry.member.id, {
          position: previousPositions.indexOf(entry.points),
          points: entry.points,
        })
      })
    }
    const membersMap = localMembersOfGroup.reduce((map, member) => {
      map.set(member.id, {
        id: member.id,
        userName: member.name,
        profileImage: member.profileImageUrl,
        points: 0,
        delta: null,
        pointsDelta: null,
      })
      return map
    }, new Map<Database.GroupMember['id'], Leaderboard[number]['member'] & { points: number; delta: Leaderboard[number]['delta']; pointsDelta: Leaderboard[number]['pointsDelta'] }>())
    if (!resultsMap) {
      console.warn('No results')
      return []
    }

    const increaseMemberPoints = (userId: Database.User['id']) => {
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
        overwriteTo,
        constructorId,
        raceId,
        memberId,
      }) => {
        if (!raceId) {
          console.warn('No race id')
          return
        }
        if (overwriteTo === 'countAsCorrect') {
          increaseMemberPoints(memberId)
          return
        }
        if (overwriteTo === 'countAsIncorrect') {
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
          increaseMemberPoints(memberId)
          return
        }
        if (predictedPosition === 'sprintP1' && raceResults.sprint) {
          const tip = predictedDriverId
          const result = raceResults.sprint.get(1)
          const isCorrect = tip === result?.id
          if (!isCorrect) return
          increaseMemberPoints(memberId)
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
        increaseMemberPoints(memberId)
      },
    )

    if (!membersMap) {
      return []
    }

    const leaderboardArray = [...membersMap.entries()]
      .map(([_userId, userInfo]) => {
        const { points, delta, pointsDelta, ...info } = userInfo
        return { points, delta, pointsDelta, member: info }
      })
      .sort(
        (a, b) =>
          b.points - a.points ||
          a.member.userName.localeCompare(b.member.userName),
      )
    const positionArray = getPositionArray(leaderboardArray)

    const leaderboard = leaderboardArray.reduce((acc, entry) => {
      const currentPosition = positionArray.indexOf(entry.points)
      const previousPosition = memberToPreviousPositionMap.size
        ? memberToPreviousPositionMap.get(entry.member.id)
        : null

      const { points: pointsDelta, position: delta } = getDelta(
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
}
