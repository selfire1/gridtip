import Alert from '@/components/alert'
import { verifySession } from '@/lib/dal'
import { getCurrentGroupId } from '@/lib/utils/groups'
import { Metadata } from 'next'
import { ResultsTable } from './_components/ResultsTable'
import PastRacesServer from './_components/PastRacesServer'

export const metadata: Metadata = {
  title: 'Leaderboard',
}

export default async function LeaderboardPage() {
  await verifySession()
  const groupId = await getCurrentGroupId()

  if (!groupId) {
    return <Alert title='No group found' />
  }

  return (
    <div className='space-y-12'>
      <ResultsTable groupId={groupId} />
      <PastRacesServer groupId={groupId} />
    </div>
  )
}
