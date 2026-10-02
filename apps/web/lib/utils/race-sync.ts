type FeedRace = {
  season: number
  circuitId: string
}

type StoredRace = {
  id: string
  circuitId: string | null
}

type StoredRaceWithGrandPrix = StoredRace & {
  grandPrixDate: Date | string
}

export function assignRaceIds<T extends FeedRace>(
  feedRaces: T[],
  storedRaces: StoredRace[],
) {
  const idByCircuitId = new Map(
    storedRaces.map((race) => [race.circuitId, race.id]),
  )

  return feedRaces.map((race) => {
    return {
      ...race,
      id:
        idByCircuitId.get(race.circuitId) ?? `${race.season}-${race.circuitId}`,
    }
  })
}

export function getRaceIdsToDelete(
  storedRaces: StoredRaceWithGrandPrix[],
  feedRaces: Pick<FeedRace, 'circuitId'>[],
  now: Date = new Date(),
) {
  if (!feedRaces.length) {
    return []
  }
  const feedCircuitIds = new Set(feedRaces.map((race) => race.circuitId))

  return storedRaces
    .filter((race) => {
      const isInFeed = race.circuitId && feedCircuitIds.has(race.circuitId)
      const isUpcoming = new Date(race.grandPrixDate).getTime() > now.getTime()
      return !isInFeed && isUpcoming
    })
    .map((race) => race.id)
}
