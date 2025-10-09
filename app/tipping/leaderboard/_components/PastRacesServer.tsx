import { PREDICTION_FIELDS } from '@/constants'
import { db } from '@/db'
import { predictionEntriesTable, predictionsTable } from '@/db/schema/schema'
import { Database } from '@/db/types'
import {
  getOnlyRacesWithResults,
  getPredictionsOfRacesAfterCutoff,
  getRaceIdToResultMap,
} from '@/lib/utils/race-results'
import { eq, inArray } from 'drizzle-orm'

export default async function PastRacesServer({
  groupId,
}: {
  groupId: string
}) {
  const racesWithResults = await getOnlyRacesWithResults()
  const results = await getRaceIdToResultMap()
  const allPredictions = await getPredictionsOfRacesAfterCutoff(groupId)
  const allPredictionsWithUser = await getAllPredictions(groupId)
  return (
    <>
      <pre> PastRacesServer</pre>
      <pre>{JSON.stringify(getGpTips(racesWithResults[0]), null, 2)}</pre>
    </>
  )

  function getGpTips(selectedRace: (typeof racesWithResults)[number]) {
    const predictionEntriesForThisRace = allPredictionsWithUser.filter(
      (entry) => entry.prediction.raceId === selectedRace.id,
    )
    const predictionsByUser = getPredictionsByUser(predictionEntriesForThisRace)
    if (!selectedRace) {
      return
    }
    const map = results?.get(selectedRace.id)?.gp
    if (!map) {
      return []
    }
    const sorted = [...map.entries()].sort(
      (a, b) => (a[0] || Infinity) - (b[0] || Infinity),
    )
    const [lastPlacePosition] = sorted.at(-1) ?? [1]
    return sorted.map(([place, driver]) => {
      const predictedP1By = predictionsByUser?.get(driver.id)?.get('p1')
      const predictedP10By = predictionsByUser?.get(driver.id)?.get('p10')
      const predictedLast = predictionsByUser?.get(driver.id)?.get('last')
      return {
        place,
        driver,
        predictedP1By,
        predictedP10By,
        predictedLast,
        didAnyonePredict: [predictedP1By, predictedP10By, predictedLast].some(
          (el) => el?.length,
        ),
        isP1Correct:
          place === 1 &&
          results.get(selectedRace.id)?.gp?.get(1)?.id === driver.id,
        isP10Correct:
          place === 10 &&
          results.get(selectedRace.id)?.gp?.get(10)?.id === driver.id,
        isLastCorrect:
          place === lastPlacePosition &&
          results.get(selectedRace.id)?.gp?.get(lastPlacePosition)?.id ===
            driver.id,
      }
    })
  }

  function getPredictionsByUser(
    currentRacePredictions: typeof allPredictionsWithUser,
  ) {
    return currentRacePredictions?.reduce((driverMap, el) => {
      const {
        driverId,
        position,
        prediction: { user: rawUser },
      } = el
      const user = rawUser as Pick<Database.User, 'id' | 'name' | 'image'>
      if (!driverId) {
        return driverMap
      }
      if (!driverMap.has(driverId)) {
        driverMap.set(driverId, new Map([[position, [user]]]))
        return driverMap
      }
      const positionMap = driverMap.get(driverId)!
      const existing = positionMap.get(position)
      positionMap.set(position, [...(existing || []), user])
      return driverMap
    }, new Map<Database.Driver['id'], Map<(typeof PREDICTION_FIELDS)[number], Pick<Database.User, 'id' | 'name' | 'image'>[]>>())
  }

  async function getAllPredictions(groupId: Database.Group['id']) {
    const predictionEntries = await db.query.predictionEntriesTable.findMany({
      where: inArray(
        predictionEntriesTable.predictionId,
        db
          .select({ id: predictionsTable.id })
          .from(predictionsTable)
          .where(eq(predictionsTable.groupId, groupId)),
      ),
      with: {
        prediction: {
          columns: {
            raceId: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        driver: {
          columns: {
            constructorId: true,
            givenName: true,
            familyName: true,
            id: true,
          },
        },
        constructor: true,
      },
    })
    return predictionEntries
  }
}
