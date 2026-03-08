'use client'

import { LucideAlertTriangle } from 'lucide-react'

export default function Banner() {
  return (
    <>
      <div className='bg-amber-200 dark:bg-amber-900 border border-b py-2 px-4 flex items-center text-sm'>
        <div className='flex items-center gap-2 flex-wrap'>
          <div className='flex items-center gap-2'>
            <LucideAlertTriangle size={16} />
            <p className='font-medium'>Qualifying Results Pending</p>
          </div>
          <p className='text-muted-foreground'>
            Qualifying results for the Australian Grand Prix are delayed. We’re
            working to resolve this shortly.
          </p>
        </div>
      </div>
    </>
  )
}
