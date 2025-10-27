import EmptyGroup from '@/components/empty-group'
import { verifyIsAdmin, verifySession } from '@/lib/dal'
import { getCurrentGroup } from '@/lib/utils/groups'
import { redirect } from 'next/navigation'

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

  return (
    <>
      <h1 className='page-title'>{group.name}</h1>
    </>
  )
}
