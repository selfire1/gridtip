import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className='h-full w-full flex items-center justify-center py-8'>
      <p className='flex items-center gap-2 text-muted-foreground'>
        <Spinner />
        Loading
      </p>
    </div>
  )
}
