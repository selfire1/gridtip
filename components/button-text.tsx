'use client'

import { Spinner } from '@ui/spinner'

export function ButtonText({
  text,
  loading,
  isPending,
}: {
  text: React.ReactNode
  loading: React.ReactNode
  isPending: boolean
}) {
  if (isPending) {
    return (
      <span className='flex items-center gap-2'>
        <Spinner />
        {loading}
      </span>
    )
  }

  return text
}
