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

export type PredictionField = (typeof PREDICTION_FIELDS)[number]
export type RacePredictionField = (typeof RACE_PREDICTION_FIELDS)[number]
export type ChampionshipPredictionField =
  (typeof CHAMPIONSHIP_PREDICTION_FIELDS)[number]

