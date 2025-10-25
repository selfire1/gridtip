import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import Breadcrumbs from '../../components/breadcrumbs'

export default async function TippingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator
              orientation='vertical'
              className='mr-2 data-[orientation=vertical]:h-4'
            />
            <Breadcrumbs />
          </div>
          <Button
            asChild
            className='sm:hidden ml-auto mr-4'
            variant='ghost'
            size='icon'
          >
            <Link href='/' title='Home' aria-label='Home'>
              <LucideHome />
            </Link>
          </Button>
        </header>
        <div className='p-4 pt-0'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
