import type { RacePredictionField } from './constants'

type DateOrString = Date | string

type StringTimestamp = string
export type GetLastUpdated = {
  races: StringTimestamp
  constructors: StringTimestamp
  drivers: StringTimestamp
}

export type GetRaces = {
  races: ApiRace[]
}

export type ApiRace = {
  id: string
  country: string
  round: number
  grandPrixDate: Date
  qualifyingDate: Date
  sprintQualifyingDate: Date | null
  locality: string
  raceName: string
  image: string
}

export type GetConstructors = {
  constructors: ApiConstructor[]
}

export type ApiConstructor = {
  name: string
  id: string
}

export type GetDrivers = {
  drivers: ApiDriver[]
}

export type ApiDriver = {
  id: string
  permanentNumber: string | null
  givenName: string
  familyName: string
  constructorId: string
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

export type NotificationPreferencesResponse = {
  enableNotifications: boolean | null
}

export type RegisterPushTokenRequest = {
  token: string
  platform?: 'ios'
}
