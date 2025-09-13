import { Database } from '@/db/types'

export const DRIVER_RACE_PREDICTION_FIELDS = [
  'sprintP1',
  'pole',
  'p1',
  'p10',
  'last',
] as const

export const CONSTRUCTOR_RACE_PREDICTION_FIELDS = [
  'constructorWithMostPoints',
] as const

export const RACE_PREDICTION_FIELDS = [
  ...DRIVER_RACE_PREDICTION_FIELDS,
  ...CONSTRUCTOR_RACE_PREDICTION_FIELDS,
] as const

export const CHAMPIONSHIP_PREDICTION_FIELDS = [
  'championshipConstructor',
  'championshipDriver',
] as const

export const PREDICTION_FIELDS = [
  ...RACE_PREDICTION_FIELDS,
  ...CHAMPIONSHIP_PREDICTION_FIELDS,
] as const

export const DEFAULT_CUTOFF_MINS = 180

export const CUTOFF_REFERENCE_KEY = {
  pole: 'qualifyingDate',
  p1: 'qualifyingDate',
  p10: 'qualifyingDate',
  last: 'qualifyingDate',
  constructorWithMostPoints: 'qualifyingDate',
  sprintP1: 'sprintQualifyingDate',
} as const satisfies Record<RacePredictionField, keyof Database.Race>

export type PredictionField = (typeof PREDICTION_FIELDS)[number]
export type RacePredictionField = (typeof RACE_PREDICTION_FIELDS)[number]
export type ChampionshipPredictionField =
  (typeof CHAMPIONSHIP_PREDICTION_FIELDS)[number]

export enum QueryOrigin {
  /**
   * Signed out from app url
   */
  SignedOut = 'signed-out',
  /**
   * Is not allowed in app url
   */
  NotAllowed = 'not-logged-in',
  Join = 'join',
}

export const GROUP_ID_COOKIE_NAME = 'grid-tip-group-id' as const
