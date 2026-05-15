import { ChevronsUpDown, LogOut } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { mockGroup, mockUser, navSections } from './mock-data'

export function VariationSimilar() {
  return (
    <aside className='flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground'>
      <div className='flex items-center gap-2 p-2'>
        <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold'>
          {mockGroup.initials}
        </div>
        <div className='flex-1 truncate text-sm font-medium'>
          {mockGroup.name}
        </div>
        <ChevronsUpDown className='size-4 text-muted-foreground' />
      </div>

      <nav className='flex-1 overflow-y-auto px-2 py-2'>
        {navSections.map((section, index) => (
          <div key={section.title}>
            {index > 0 && <Separator className='my-2' />}
            <div className='px-2 pt-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              {section.title}
            </div>
            <ul className='flex flex-col gap-0.5'>
              {section.items.map((item) => (
                <li key={item.title}>
                  <a
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      item.active &&
                        'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                    )}
                  >
                    <item.icon className='size-4 shrink-0' />
                    <span className='truncate'>{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className='border-t border-sidebar-border p-2'>
        <div className='flex items-center gap-2 rounded-md p-2'>
          <div className='flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold'>
            {mockUser.initials}
          </div>
          <div className='flex-1 overflow-hidden'>
            <div className='truncate text-sm font-medium'>{mockUser.name}</div>
            <div className='truncate text-xs text-muted-foreground'>
              {mockUser.email}
            </div>
          </div>
          <LogOut className='size-4 text-muted-foreground' />
        </div>
      </div>
    </aside>
  )
}
