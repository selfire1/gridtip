import { verifySession } from '@/lib/dal'
import { getCurrentGroup } from '@/lib/repository'

export default async function DashboardPage() {
  const { userId } = await verifySession()
  const currentGroup = await getCurrentGroup(userId)

  return <pre>{currentGroup?.name}</pre>
}
