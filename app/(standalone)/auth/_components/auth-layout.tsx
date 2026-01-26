import Logo from '@/components/logo'

export default function AuthLayout({
  slotPrimary,
  slotSecondary,
}: {
  slotPrimary: React.ReactNode
  slotSecondary: React.ReactNode
}) {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs'>{slotPrimary}</div>
        </div>
      </div>
      <div className='bg-muted relative hidden lg:block'>{slotSecondary}</div>
    </div>
  )
}
