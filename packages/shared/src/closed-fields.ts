import { RACE_PREDICTION_FIELDS, type RacePredictionField } from './constants'
import { getIsSprint } from './is-sprint'

type DateOrString = Date | string

type CutoffRace = {
  qualifyingDate: DateOrString
  sprintQualifyingDate: DateOrString | null
}

export function getDueDatesForTips(race: CutoffRace, cutoff: number) {
  const isSprint = getIsSprint(race)
  return {
    sprint:
      isSprint && race.sprintQualifyingDate
        ? subMinutes(race.sprintQualifyingDate, cutoff)
        : undefined,
    grandPrix: subMinutes(race.qualifyingDate, cutoff),
  }
}

export function getClosedFields(
  race: CutoffRace,
  cutoff: number,
  baseDate = new Date(),
): Set<RacePredictionField> {
  const isSprint = getIsSprint(race)
  const tipsDue = getDueDatesForTips(race, cutoff)

  const disabledFields = new Set<RacePredictionField>()
  if (isSprint && tipsDue.sprint && isPastForBaseDate(tipsDue.sprint)) {
    disabledFields.add('sprintP1')
  }
  if (tipsDue.grandPrix && isPastForBaseDate(tipsDue.grandPrix)) {
    RACE_PREDICTION_FIELDS.forEach((field) => {
      disabledFields.add(field)
    })
  }
  return disabledFields

  function isPastForBaseDate(date: Date) {
    return date.getTime() < baseDate.getTime()
  }
}

export function omitClosedFields<T extends Record<string, unknown>>(
  data: T,
  closedFields: Set<string>,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !closedFields.has(key)),
  ) as Partial<T>
}

function subMinutes(date: DateOrString, minutes: number) {
  return new Date(new Date(date).getTime() - minutes * 60_000)
}
