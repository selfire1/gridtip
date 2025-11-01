import { ConstructorProps } from '@/components/constructor'
import { DriverOptionProps } from '@/components/driver-option'
import { RacePredictionField } from '@/constants'
import { Database } from '@/db/types'
import { isPredictionForRace } from '@/lib/utils/prediction-fields'
import { AllPredictions } from '@/lib/utils/race-results'

export type PredictionRow = {
  id: string
  userName: string
  user: {
    id: string
    name: string
  }
  value: DriverOptionProps | ConstructorProps
  raceDate: string
  race: {
    id: Database.Race['id']
    label: string
  }
  created: string
  position: RacePredictionField
  type: 'driver' | 'constructor'
}

export function formatPredictionsToRows(
  entries: AllPredictions,
  maps: {
    driver: Map<Database.Driver['id'], DriverOptionProps>
    constructor: Map<Database.Constructor['id'], ConstructorProps>
    race: Map<
      Database.Race['id'],
      Pick<Database.Race, 'locality' | 'grandPrixDate'>
    >
  },
): PredictionRow[] {
  const { driver: driverMap, constructor: constructorMap } = maps
  return entries
    .filter((entry) => isPredictionForRace(entry.position))
    .map((entry) => {
      const {
        prediction: { user },
      } = entry

      const race = maps.race.get(entry.prediction.raceId!)!
      return {
        id: entry.id,
        created: entry.prediction.createdAt.toString(),
        raceDate: race.grandPrixDate.toString(),
        race: {
          id: entry.prediction.raceId!,
          label: race.locality,
        },
        userName: user.name,
        user: {
          id: user.id,
          name: user.name,
        },
        value: getValue()!,
        position: entry.position as RacePredictionField,
        type: getType(),
      }

      function getType() {
        return entry.driverId ? 'driver' : 'constructor'
      }

      function getValue() {
        const value =
          getType() === 'driver'
            ? driverMap.get(entry.driverId as string)
            : constructorMap.get(entry.constructorId as string)
        if (!value) {
          // TODO: track error
          console.error('no value', entry)
        }
        return value
      }
    })
}
