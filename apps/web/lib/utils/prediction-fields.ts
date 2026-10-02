import {
  RACE_PREDICTION_FIELDS,
  type RacePredictionField,
} from '@gridtip/shared/constants'
import { CUTOFF_REFERENCE_KEY } from '@/constants'
import { Database } from '@/db/types'
import { isAfter, isBefore, subMinutes } from 'date-fns'
import { getIsSprint } from '@gridtip/shared/is-sprint'

/**
 * Is this position part of the tips for a race
 */
export function isPredictionForRace(
  position: string,
): position is RacePredictionField {
  return RACE_PREDICTION_FIELDS.includes(position as RacePredictionField)
}

export function getDueDatesForTips(race: Database.Race, cutoff: number) {
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
  const openPositions = positionsToTip.filter(
    (position) => !isPositionClosed(position),
  )
  const areThereAnyOpenPositions = Boolean(openPositions.length)
  return areThereAnyOpenPositions

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

export function omitClosedFields<T extends Record<string, unknown>>(
  data: T,
  closedFields: Set<string>,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !closedFields.has(key)),
  ) as Partial<T>
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

export function throwIfAnyNewFieldIsAfterCutoff(
  targetRace: Pick<Database.Race, Values>,
  timeOfSubmission: Date,
  body: Partial<Record<RacePredictionField, { id: string }>>,
  group: Pick<Database.Group, 'cutoffInMinutes'>,
  existingEntries?: Pick<
    Database.PredictionEntry,
    'position' | 'driverId' | 'constructorId'
  >[],
) {
  function getIsPositionAfterCutoff(info: {
    position: RacePredictionField
    testDate: Date
  }) {
    return isPositionAfterCutoff({
      race: targetRace,
      cutoff: group.cutoffInMinutes,
      ...info,
    })
  }

  const positionsPredicted = Object.keys(body).filter((key) =>
    RACE_PREDICTION_FIELDS.includes(key as RacePredictionField),
  ) as RacePredictionField[]
  const existingPredictionValuesMap = existingEntries?.reduce(
    (acc, entry) => {
      if (
        !RACE_PREDICTION_FIELDS.includes(entry.position as RacePredictionField)
      ) {
        return acc
      }
      acc[entry.position as RacePredictionField] =
        entry.driverId || entry.constructorId
      return acc
    },
    {} as Partial<
      Record<
        RacePredictionField,
        | Database.PredictionEntry['constructorId']
        | Database.PredictionEntry['driverId']
      >
    >,
  )

  for (const position of positionsPredicted) {
    const isAfterCutoff = getIsPositionAfterCutoff({
      position,
      testDate: timeOfSubmission,
    })
    const isUnchanged =
      existingPredictionValuesMap?.[position] === body[position]?.id
    if (isAfterCutoff && !isUnchanged) {
      console.warn('Is new or changed and is after cutoff', {
        existing: existingPredictionValuesMap,
        body,
      })
      throwError(position)
    }
  }
  function throwError(position: RacePredictionField) {
    throw new Error(`Cannot predict ${position} after cutoff`)
  }
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

export function getLabel(
  position: RacePredictionField,
  options?: { short?: boolean },
) {
  const positionToLabel: Record<RacePredictionField, string> = {
    pole: 'Pole position',
    p1: 'P1',
    p10: 'P10',
    last: 'Last position',
    constructorWithMostPoints: 'Constructor with most points',
    sprintP1: 'Sprint P1',
  }
  const positionToLabelShort: Record<RacePredictionField, string> = {
    pole: 'Pole',
    p1: 'P1',
    p10: 'P10',
    last: 'Last',
    constructorWithMostPoints: 'Constructor (most points)',
    sprintP1: 'Sprint P1',
  }
  if (options?.short) {
    return positionToLabelShort[position]
  }
  return positionToLabel[position]
}

export type TipType = 'driver' | 'constructor'
export function getTipTypeFromPosition(position: RacePredictionField): TipType {
  const positionToType: Record<RacePredictionField, TipType> = {
    sprintP1: 'driver',
    pole: 'driver',
    p1: 'driver',
    p10: 'driver',
    last: 'driver',
    constructorWithMostPoints: 'constructor',
  }
  return positionToType[position]
}
