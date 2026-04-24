import type { RacePredictionField } from './constants'

type DateOrString = Date | string

export type ApiRace = {
  id: string
  country: string
  round: number
  circuitName: string
  raceName: string
  grandPrixDate: DateOrString
  qualifyingDate: DateOrString
  sprintDate: DateOrString | null
  sprintQualifyingDate: DateOrString | null
  locality: string
  lastUpdated: DateOrString
  created: DateOrString
  image: string
  isSprint: boolean
}

export type ApiDriver = {
  id: string
  constructorId: string
  givenName: string
  familyName: string
  permanentNumber: string | null
}

export type ApiConstructor = {
  id: string
  name: string
  image: string
}

export type ApiGroup = {
  joinedAt: DateOrString
  group: {
    id: string
    name: string
    iconName: string
    championshipTipsRevalDate: DateOrString | null
    constructorsChampionshipPoints: number
    driversChampionshipPoints: number
  }
}

export type FormDetailsResponse = {
  race: ApiRace | undefined
  drivers: ApiDriver[]
  constructors: ApiConstructor[]
}

export type MyGroupsResponse = {
  groups: ApiGroup[]
}

export type GetTipsResponse = Record<RacePredictionField, { id: string }>

export type SubmitTipsResponse = {
  ok: boolean
  message: string
}
