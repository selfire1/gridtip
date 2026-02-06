import { AppHeader } from '@/components/app-header'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-[80svh] flex flex-col isolate'>
      <div className='fixed top-0 inset-x-0 z-10 bg-linear-to-b from-muted to-transparent pb-8'>
        <AppHeader />
      </div>
      <div className='pt-0 sm:pt-0'>{children}</div>
    </div>
  )
}
