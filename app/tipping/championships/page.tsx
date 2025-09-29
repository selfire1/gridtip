import {
  getConstructorOptions,
  getCurrentGroupId,
  getDriverOptions,
} from '@/lib/repository'
import ChampionshipForm, { Schema } from './components/championship-form'
import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { DeepPartial } from '@/app/types'

export default async function ChampionshipPage() {
  const { userId } = await verifySession()
  const groupId = await getCurrentGroupId()

  const drivers = await getDriverOptions()
  const constructors = await getConstructorOptions()

  const defaults = await getDefaultValues()

  const isAfterDeadline = true

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <h1 className='page-title'>
          {isAfterDeadline ? 'Your Championship Tips' : 'Tip Championships'}
        </h1>
        <p className='text-muted-foreground'>
          {isAfterDeadline
            ? 'Score extra points by guessing the Constructors’ and Drivers’ Championships.'
            : 'Guess the Constructors’ and Drivers’ Championships to secure extra points.'}
        </p>
      </div>
      <ChampionshipForm
        defaultValues={defaults}
        drivers={drivers}
        constructors={constructors}
        disabled={isAfterDeadline}
      />
    </div>
  )

  async function getDefaultValues(): Promise<DeepPartial<Schema>> {
    const tips = await getDefaultValuesArray()
    const driverTip = tips.find((tip) => tip.position === 'championshipDriver')
    const constructorTip = tips.find(
      (tip) => tip.position === 'championshipConstructor',
    )
    return {
      driver: {
        id: driverTip?.driver?.id,
      },
      constructor: {
        id: constructorTip?.constructor?.id,
      },
    }
  }

  async function getDefaultValuesArray() {
    if (!groupId) {
      return []
    }
    const tip = await db.query.predictionsTable.findFirst({
      where: (prediction, { eq, and }) =>
        and(
          eq(prediction.groupId, groupId),
          eq(prediction.userId, userId),
          eq(prediction.isForChampionship, true),
        ),
    })
    if (!tip?.id) return []
    return await db.query.predictionEntriesTable.findMany({
      where: (entry, { eq }) => eq(entry.predictionId, tip.id),
      columns: {
        position: true,
      },
      with: {
        constructor: {
          columns: {
            id: true,
            name: true,
          },
        },
        driver: {
          columns: {
            id: true,
            givenName: true,
            familyName: true,
          },
        },
      },
    })
  }
}
