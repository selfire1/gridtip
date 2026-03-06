import { verifySession } from '@/lib/dal'
import { getCurrentGroupId } from '@/lib/utils/groups'
import { Metadata } from 'next'
import { LeaderboardWrapper } from './_components/leaderboard-wrapper'
import PastRacesServer from './_components/PastRacesServer'
import { Separator } from '@/components/ui/separator'
import EmptyGroup from '@/components/empty-group'
import { GLOBAL_GROUP_ID } from '@/constants/group'
import { WreathSide } from '@/components/wreath'

export const metadata: Metadata = {
  title: 'Leaderboard',
}

export default async function LeaderboardPage() {
  await verifySession()
  const groupId = await getCurrentGroupId()

  if (!groupId) {
    return <EmptyGroup />
  }

  const isGlobalGroup = groupId === GLOBAL_GROUP_ID
  const title = !isGlobalGroup ? (
    <h1 className='sr-only'>Leaderboard</h1>
  ) : (
    <span className='flex flex-col sm:flex-row items-center gap-2 justify-center'>
      <WreathSide side='left' className='shrink-0 hidden sm:block' />
      <h1 className='page-title'>Global Top Ten</h1>
      <WreathSide side='right' className='shrink-0 hidden sm:block' />
    </span>
  )

  return (
    <>
      <section className='space-y-6'>
        {title}
        <LeaderboardWrapper groupId={groupId} />
      </section>
      {groupId === GLOBAL_GROUP_ID ? undefined : (
        <>
          <div className='-mx-4'>
            <Separator className='my-12' />
          </div>
          <section>
            <h2 className='title-2'>Race Results</h2>
            <PastRacesServer groupId={groupId} />
          </section>
        </>
      )}
    </>
  )
}
