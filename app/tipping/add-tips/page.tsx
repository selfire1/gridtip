import Alert from '@/components/alert'
import { verifySession } from '@/lib/dal'
import { getNextRace } from '@/lib/utils/races'
import { Metadata } from 'next'
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
}
