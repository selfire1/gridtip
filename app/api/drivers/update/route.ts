import { CacheTag } from '@/constants/cache'
import { revalidateTag, unstable_cache } from 'next/cache'
import { NextRequest } from 'next/server'
import { createResponse, fetchJolpica, validateToken, wait } from '../../utils'
import { DriverResponse } from '@/types/ergast'
import { db } from '@/db'
import { driversTable } from '@/db/schema/schema'
import { sql } from 'drizzle-orm'
import { Database } from '@/db/types'

export const GET = async (_request: NextRequest) => {
  const validationResponse = await validateToken()
  if (!validationResponse.ok) {
    return validationResponse
  }

  type JolpicaDrivers = Awaited<ReturnType<typeof getJolpicaDrivers>>
  let jolpicaDrivers: JolpicaDrivers
  try {
    jolpicaDrivers = await getJolpicaDrivers()
  } catch (error) {
    return createResponse(
      500,
      'Failed to fetch drivers: ' + (error as Error).message,
    )
  }

  if (!jolpicaDrivers?.length) {
    return createResponse(404, 'No drivers found')
  }

  // TODO: evaluate difference, handling jolpica giving us back the same driver multiple time with different teams on change
  // const isDifferent = await getIsThereDifferenceInDrivers(jolpicaDrivers)

  // if (!isDifferent) {
  //   return createResponse(200, 'No update required')
  // }

  const ids = await setDriversInDatabase(jolpicaDrivers)
  revalidateTag(CacheTag.Drivers)

  return createResponse(201, {
    updated: ids.length,
    received: jolpicaDrivers.length,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function getIsThereDifferenceInDrivers(
    newItems: Awaited<ReturnType<typeof getJolpicaDrivers>>,
  ) {
    const getStoredDrivers = unstable_cache(
      async () =>
        await db.query.driversTable.findMany({
          columns: {
            id: true,
            permanentNumber: true,
            fullName: true,
            givenName: true,
            familyName: true,
            nationality: true,
            constructorId: true,
          },
        }),
      [],
      {
        tags: [CacheTag.Drivers],
      },
    )
    const storedDrivers = await getStoredDrivers()

    if (storedDrivers.length < newItems.length) {
      console.log('difference: true', storedDrivers.length, newItems.length)
      console.log(
        'new',
        newItems.map((driver) => driver.id),
      )
      console.log(
        'stored',
        storedDrivers.map((driver) => driver.id),
      )

      return true
    }

    const storedDriversMap = new Map(
      storedDrivers.map((driver) => [driver.id + driver.constructorId, driver]),
    )

    const hasNoDifference = newItems.every((newDriver) => {
      if (!newDriver.id) {
        console.log('difference: true', 'no id', newDriver.id)

        // if no id, assume no difference
        return true
      }
      const storedDriver = storedDriversMap.get(newDriver.id)
      if (!storedDriversMap.has(newDriver.id + newDriver.constructorId)) {
        // if no stored driver, assume difference
        return false
      }
      if (
        areFieldsTheSame(
          [
            'permanentNumber',
            'id',
            'fullName',
            'givenName',
            'familyName',
            'nationality',
            'constructorId',
          ],
          {
            newItem: newDriver,
            storedItem: storedDriver!,
          },
        )
      ) {
        return true
      }
      return false
      function areFieldsTheSame(
        fields: (keyof JolpicaDrivers[number])[],

        compare: {
          newItem: typeof newDriver
          storedItem: NonNullable<typeof storedDriver>
        },
      ) {
        const { newItem, storedItem } = compare
        for (const field of fields) {
          if (!(field in storedItem)) {
            console.log('difference: true', 'no field', field)
            return false
          }
          if (newItem[field] !== storedItem[field as keyof typeof storedItem]) {
            console.log('difference: false', field)
            return false
          }
        }
        return true
      }
    })
    return !hasNoDifference
  }

  async function getJolpicaDrivers() {
    const getConstructorsIds = unstable_cache(
      async () =>
        await db.query.constructorsTable.findMany({
          columns: {
            id: true,
          },
        }),
      [],
      {
        tags: [CacheTag.Constructors],
      },
    )
    const constructors = await getConstructorsIds()

    const drivers: Database.InsertDriver[] = []

    for await (const constructor of constructors) {
      await wait(1000) // NOTE: to keep within API burst limit

      const {
        MRData: {
          DriverTable: { Drivers: apiDrivers },
        },
      } = await fetchJolpica<DriverResponse>(
        `/ergast/f1/2026/constructors/${constructor.id}/drivers/`,
      )
      if (!apiDrivers?.length) {
        continue
      }

      drivers.push(
        ...apiDrivers.map(
          (driver): Database.InsertDriver => ({
            id: driver.driverId,
            permanentNumber: driver.permanentNumber,
            fullName: driver.givenName + ' ' + driver.familyName,
            givenName: driver.givenName,
            familyName: driver.familyName,
            nationality: driver.nationality,
            constructorId: constructor.id,
            lastUpdated: new Date(),
          }),
        ),
      )
    }
    return drivers
  }

  async function setDriversInDatabase(drivers: JolpicaDrivers) {
    const returning = await db
      .insert(driversTable)
      .values(drivers)
      .onConflictDoUpdate({
        target: driversTable.id,
        set: {
          permanentNumber: sql`excluded.permanent_number`,
          fullName: sql`excluded.full_name`,
          givenName: sql`excluded.given_name`,
          familyName: sql`excluded.family_name`,
          nationality: sql`excluded.nationality`,
          constructorId: sql`excluded.constructor_id`,
          lastUpdated: sql`excluded.last_updated`,
        },
      })
      .returning({
        id: driversTable.id,
      })
    return returning
  }
}
