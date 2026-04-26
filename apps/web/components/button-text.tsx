'use client'

import { Spinner } from '@ui/spinner'

export function ButtonText({
  label,
  pendingText: pendingText,
  isPending,
}: {
  label: React.ReactNode
  pendingText: React.ReactNode | string
  isPending: boolean
}) {
  if (isPending) {
    return (
      <span className='flex items-center gap-2'>
        <Spinner />
        {pendingText}
      </span>
    )
  }

  return label
}
