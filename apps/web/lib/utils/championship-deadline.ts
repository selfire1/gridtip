import { isAfter } from 'date-fns'

type FirstRace = { qualifyingDate: Date } | undefined

export function isAfterChampionshipDeadline(
  firstRace: FirstRace,
  now: Date = new Date(),
) {
  if (!firstRace) {
    return false
  }
  return isAfter(now, firstRace.qualifyingDate)
}
