import { columns } from './_components/columns'
import { DataTable } from './_components/data-table'
import EmptyGroup from '@/components/empty-group'
import { verifyIsAdmin, verifySession } from '@/lib/dal'
import {
  getConstructorOptions,
  getCurrentGroup,
  getDriverOptions,
} from '@/lib/utils/groups'
import { createGetAllPredictions } from '@/lib/utils/race-results'
import { redirect } from 'next/navigation'
import { formatPredictionsToRows } from './_utils/rows'
import { unstable_cache } from 'next/cache'
import { db } from '@/db'
import { CacheTag } from '@/constants/cache'

export default async function GroupSettings() {
  const { userId } = await verifySession()
  const group = await getCurrentGroup(userId)

  if (!group) {
    return <EmptyGroup />
  }

  const { isAdmin } = await verifyIsAdmin(group.id)

  if (!isAdmin) {
    redirect('/tipping')
  }

  const [predictions, constructors, drivers, races] = await Promise.all([
    createGetAllPredictions(group.id)(),
    getConstructorOptions(),
    getDriverOptions(),
    getRaces(),
  ])

  const constructorMap = new Map(
    constructors.map((constructor) => [constructor.id, constructor]),
  )
  const driverMap = new Map(drivers.map((driver) => [driver.id, driver]))
  const raceMap = new Map(races.map((race) => [race.id, race]))

  const rows = formatPredictionsToRows(predictions, {
    constructor: constructorMap,
    driver: driverMap,
    race: raceMap,
  })

  return (
    <>
      <h1 className='page-title'>{group.name}</h1>
      <DataTable columns={columns} data={rows} />
    </>
  )

  function getRaces() {
    return unstable_cache(
      async () =>
        await db.query.racesTable.findMany({
          columns: {
            id: true,
            locality: true,
            grandPrixDate: true,
          },
        }),
      [],
      {
        tags: [CacheTag.Races],
      },
    )()
  }
}
