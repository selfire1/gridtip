import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockGroup, mockUser, navSections } from './mock-data'

export function VariationLinear() {
  return (
    <aside className='flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground text-[13px]'>
      <div className='flex items-center gap-2 px-3 pt-3 pb-2'>
        <div className='flex size-5 items-center justify-center rounded bg-foreground/90 text-[10px] font-bold text-background'>
          {mockGroup.initials.charAt(0)}
        </div>
        <div className='flex-1 truncate font-medium'>{mockGroup.name}</div>
        <ChevronDown className='size-3.5 text-muted-foreground' />
      </div>

      <div className='px-3 pb-2'>
        <div className='flex items-center gap-2 rounded-md border border-sidebar-border bg-foreground/[0.02] px-2 py-1.5 text-muted-foreground'>
          <Search className='size-3.5' />
          <span className='flex-1 text-[12px]'>Search…</span>
          <kbd className='rounded border border-sidebar-border bg-background px-1 py-px font-mono text-[10px] leading-none'>
            ⌘K
          </kbd>
        </div>
      </div>

      <nav className='flex-1 overflow-y-auto px-1.5 py-1'>
        {navSections.map((section, index) => (
          <div key={section.title} className={cn(index > 0 && 'mt-3')}>
            <div className='relative flex items-center px-2 pb-1.5 pt-1'>
              <span className='text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80'>
                {section.title}
              </span>
            </div>
            <ul className='flex flex-col'>
              {section.items.map((item) => (
                <li key={item.title} className='relative'>
                  {item.active && (
                    <span className='absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-foreground' />
                  )}
                  <a
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                      'hover:bg-foreground/[0.04]',
                      item.active && 'bg-foreground/[0.05] font-medium',
                    )}
                  >
                    <item.icon className='size-3.5 shrink-0 text-muted-foreground' />
                    <span className='flex-1 truncate'>{item.title}</span>
                    {item.shortcut && (
                      <span className='font-mono text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100'>
                        {item.shortcut}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className='border-t border-sidebar-border px-3 py-2'>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <div className='flex size-6 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-medium'>
              {mockUser.initials}
            </div>
            <span className='absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-sidebar' />
          </div>
          <div className='flex-1 overflow-hidden'>
            <div className='truncate text-[12px] font-medium'>
              {mockUser.name}
            </div>
          </div>
          <ChevronDown className='size-3.5 text-muted-foreground' />
        </div>
      </div>
    </aside>
  )
}
