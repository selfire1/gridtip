export type Constructor = {
  id?: string
  name?: string
  nationality?: string
}

export type RaceResponse = ErgastResponse<{
  RaceTable?: RaceTable
}>

export type ResultsResponse = ErgastResponse<{
  RaceTable?: {
    season: string
    Races: Array<
      Race & {
        Results: ResultRace[]
      }
    >
  }
}>

export type SprintResultsResponse = ErgastResponse<{
  RaceTable?: {
    season: string
    Races: Array<
      Race & {
        SprintResults: ResultRace[]
      }
    >
  }
}>

export type DriverResponse = ErgastResponse<{
  DriverTable: DriverTable
}>
export type ConstructorsResponse = ErgastResponse<{
  ConstructorTable: {
    Constructors: {
      constructorId?: string
      url?: string
      name: string
      nationality?: string
    }[]
  }
}>

interface MRData {
  xmlns: string
  series: 'f1'
  url: string
  limit: string
  offset: string
  total: string
}

type ErgastResponse<T> = {
  MRData: MRData & T
}

interface RaceTable {
  season: string
  Races: Race[]
}

interface ResultRace extends Race {
  /**
   * The drivers number
   */
  number: string
  /**
   * Finishing position of the drive
   */
  position: string
  points: string
  /**
   * either an integer (finishing position), or
   * “R” (retired), “D” (disqualified), “E” (excluded), “W” (withdrawn), “F” (failed to qualify) or “N” (not classified)
   */
  positionText: string
  Driver: Driver
  Constructor?: Constructor & { constructorId: string }
  grid?: string
  laps?: string
  status?: 'Finished' | string
  Time?: {
    millis: string
    time: string
  }
  FastestLap?: {
    ranks: string
    lap: string
    Time: {
      time: string
    }
    AverageSpeed: {
      units: string
      speed: string
    }
  }
}

interface Race {
  season: string
  round: string
  raceName: string
  Circuit: Circuit
  date: string // ISO date string
  time?: string // Optional ISO time string
  FirstPractice?: Session
  SecondPractice?: Session
  ThirdPractice?: Session
  Qualifying?: Session
  Sprint?: Session
  SprintQualifying?: Session
}

interface Circuit {
  circuitId: string
  url: string
  circuitName: string
  Location: Location
}

interface Location {
  lat: string // Latitude as a string
  long: string // Longitude as a string
  locality: string
  country: string
}

interface Session {
  date: string // ISO date string
  time?: string // Optional ISO time string
}

interface DriverTable {
  season: string
  Drivers: Driver[]
}

interface Driver {
  driverId: string
  permanentNumber: string
  code: string
  url: string
  givenName: string
  familyName: string
  dateOfBirth: string // ISO date string
  nationality: string
}
