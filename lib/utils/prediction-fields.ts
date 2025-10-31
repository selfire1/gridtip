import {
  CUTOFF_REFERENCE_KEY,
  PredictionField,
  RACE_PREDICTION_FIELDS,
  RacePredictionField,
} from '@/constants'
import { Database } from '@/db/types'
import { isAfter, isBefore, subMinutes } from 'date-fns'

/**
 * Is this position part of the tips for a race
 */
export function isPredictionForRace(
  position: string,
): position is RacePredictionField {
  return RACE_PREDICTION_FIELDS.includes(position as RacePredictionField)
}

export function getPositionType(
  position: PredictionField,
): 'driver' | 'constructor' {
  switch (position) {
    case 'sprintP1':
    case 'pole':
    case 'p1':
    case 'p10':
    case 'last':
    case 'championshipDriver':
      return 'driver'
    case 'constructorWithMostPoints':
    case 'championshipConstructor':
      return 'constructor'
  }
}

export function getIsSprint(race: Pick<Database.Race, 'sprintQualifyingDate'>) {
  return !!race.sprintQualifyingDate
}

export function getTipsDue(race: Database.Race, cutoff: number) {
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
  race: Database.Race,
  cutoff: number,
  baseDate = new Date(),
): Set<RacePredictionField> {
  const isSprint = getIsSprint(race)
  const tipsDue = getTipsDue(race, cutoff)

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
    return isBefore(date, baseDate)
  }
}

export function isRaceAbleToBeTipped(
  race: Database.Race,
  cutoff: number,
  baseDate = new Date(),
) {
  const closedFields = getClosedFields(race, cutoff, baseDate)
  const positionsToTip = getPositionsStillToTip()
  const areAllPositionsClosed = positionsToTip.every(
    (position) => !isPositionClosed(position),
  )
  return areAllPositionsClosed

  function getPositionsStillToTip() {
    if (getIsSprint(race)) {
      return RACE_PREDICTION_FIELDS.filter((pos) => !isPositionClosed(pos))
    }
    return RACE_PREDICTION_FIELDS.filter((pos) => pos === 'sprintP1') // on a non-sprint race, don't count sprint position
      .filter((pos) => !isPositionClosed(pos))
  }

  function isPositionClosed(position: RacePredictionField) {
    return closedFields.has(position)
  }
}

type Reference = typeof CUTOFF_REFERENCE_KEY
type Values = Reference[keyof Reference]
export function isPositionAfterCutoff(info: {
  race: Pick<Database.Race, Values>
  position: RacePredictionField
  testDate: Date
  cutoff: number
}): boolean {
  const { race, position, testDate, cutoff } = info
  const cutoffDate = getCutoffDateForPosition(race, position, cutoff)
  if (!cutoffDate) {
    // if none provided, it's treated as being after the cutoff
    return true
  }
  return isAfter(testDate, cutoffDate)
}

function getCutoffDateForPosition(
  race: Pick<Database.Race, Values>,
  position: RacePredictionField,
  cutoff: number,
): Date | null {
  const rawCutoffDate = race[CUTOFF_REFERENCE_KEY[position]]
  if (!rawCutoffDate) {
    return null
  }
  const lastChanceToEnterTips = subMinutes(rawCutoffDate, cutoff)
  return lastChanceToEnterTips
}

export function getLabel(position: RacePredictionField) {
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
