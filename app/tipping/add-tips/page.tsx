import Alert from '@/components/alert'
import { CacheTag } from '@/constants/cache'
import { db } from '@/db'
import { verifySession } from '@/lib/dal'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Enter tips',
}

export default async function AddTipping() {
  const { userId: _ } = await verifySession()

  const nextRace = await getNextRace()

  if (nextRace) {
    redirect(`/tipping/add-tips/${nextRace.id}`)
  }

  return (
    <Alert
      title='No next race'
      description='There are no races scheduled for the future.'
    />
  )

  async function getNextRace() {
    return await unstable_cache(
      async () =>
        await db.query.racesTable.findFirst({
          orderBy: (race) => race.round,
          columns: {
            id: true,
          },
          where: (race, { gt }) => gt(race.grandPrixDate, new Date()),
        }),
      [],
      {
        tags: [CacheTag.Races],
        revalidate: 60 * 10,
      },
    )()
  }
}
