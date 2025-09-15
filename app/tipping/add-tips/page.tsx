import Alert from '@/components/alert'
import { db } from '@/db'
import { verifySession } from '@/lib/dal'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Enter tips',
}

export default async function AddTipping() {
  const { userId: _ } = await verifySession()

  const nextRace = await db.query.racesTable.findFirst({
    orderBy: (race) => race.round,
    columns: {
      id: true,
    },
    where: (race, { gt }) => gt(race.grandPrixDate, new Date()),
  })

  if (nextRace) {
    redirect(`/tipping/add-tips/${nextRace.id}`)
  }

  return (
    <Alert
      title='No next race'
      description='There are no races scheduled for the future.'
    />
  )
}
