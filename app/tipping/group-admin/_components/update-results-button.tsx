'use client'

import Button from '@/components/button'
import React from 'react'
import { toast } from 'sonner'
import { updateCache } from '../_utils/update-results-action'

export function UpdateResultsButton() {
  const [isPending, startTransition] = React.useTransition()

  return (
    <Button
      label='Clear cache'
      isPending={isPending}
      onClick={handleClick}
    ></Button>
  )
  async function handleClick() {
    startTransition(async () => {
      try {
        const result = await updateCache()
        if (!result.ok) {
          throw new Error(result.message)
        }
        toast.success('Updated predictions cache')
      } catch (error) {
        toast.error((error as Error).message)
      }
    })
  }
}
