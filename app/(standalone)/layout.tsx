import { AppHeader } from '@/components/app-header'

export default function FullScreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-svh flex flex-col isolate'>
      <div className='fixed top-0 bg-gradient-to-b from-muted to-transparent inset-x-0 z-10'>
        <AppHeader />
      </div>
      <div className='pt-12'>{children}</div>
    </div>
  )
}
