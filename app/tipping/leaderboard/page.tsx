import Alert from '@/components/alert'
import { verifySession } from '@/lib/dal'
import { getCurrentGroupId } from '@/lib/utils/groups'
import { Metadata } from 'next'
import { ResultsTable } from './_components/ResultsTable'
import PastRacesServer from './_components/PastRacesServer'
import { Separator } from '@/components/ui/separator'

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
    <>
      <section>
        <h1 className='sr-only'>Leaderboard</h1>
        <ResultsTable groupId={groupId} />
      </section>
      <div className='-mx-4'>
        <Separator className='my-12' />
      </div>
      <section>
        <h2 className='title-2'>Race Results</h2>
        <PastRacesServer groupId={groupId} />
      </section>
    </>
  )
}
