type RaceWithGrandPrix = {
  id: string
  round: number
  grandPrixDate: Date | string
}

export function selectNextRace<T extends RaceWithGrandPrix>(
  races: T[],
  now: Date = new Date(),
) {
  const upcomingRaces = races
    .filter((race) => {
      return new Date(race.grandPrixDate).getTime() > now.getTime()
    })
    .sort((a, b) => {
      return a.round - b.round
    })

  return upcomingRaces[0]
}
