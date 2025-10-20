import { AppHeader } from '@/components/app-header'

export default function FullScreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='bg-muted min-h-svh flex flex-col isolate'>
      <div className='fixed top-0 bg-gradient-to-b from-muted to-transparent inset-x-0'>
        <AppHeader />
      </div>
      <div className='grow flex flex-col items-center justify-center p-6 md:p-10'>
        <div className='w-full max-w-sm md:max-w-3xl'>{children}</div>
      </div>
    </div>
  )
}
