'use client'

import { joinGroup } from '@/actions/join-group'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Database } from '@/db/types'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

export default function JoinGroupClient({
  groupId,
}: {
  groupId: Database.Group['id']
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button className='w-full' disabled={isPending} onClick={requestJoin}>
      {isPending && <Spinner />}
      Join Group
    </Button>
  )

  async function requestJoin() {
    startTransition(async () => {
      const result = await joinGroup({
        groupId,
      })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      router.push('/tipping')
      toast.success(
        <p>
          Joined{' '}
          {result.group?.name ? (
            <span className='font-medium'>{result.group?.name}</span>
          ) : (
            'group'
          )}
        </p>,
      )
    })
  }
}
