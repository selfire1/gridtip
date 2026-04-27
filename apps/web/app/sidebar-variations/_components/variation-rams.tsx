import { cn } from '@/lib/utils'
import { mockUser, navSections } from './mock-data'

const BRAUN_ORANGE = '#ff7a00'

export function VariationRams() {
  let runningIndex = 0

  return (
    <aside className='flex h-full w-64 flex-col border-r border-neutral-300 bg-[#f4f1ec] font-mono text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'>
      <div className='flex items-center gap-3 border-b border-neutral-300 p-4 dark:border-neutral-800'>
        <BraunDial />
        <div className='leading-tight'>
          <div className='text-[11px] font-bold uppercase tracking-[0.2em]'>
            Gridtip
          </div>
          <div className='text-[9px] uppercase tracking-[0.15em] text-neutral-500'>
            TS&middot;505
          </div>
        </div>
      </div>

      <nav className='flex-1 overflow-y-auto'>
        {navSections.map((section, sectionIndex) => {
          const start = runningIndex + 1
          const end = runningIndex + section.items.length
          const startStr = String(start).padStart(2, '0')
          const endStr = String(end).padStart(2, '0')

          return (
            <div
              key={section.title}
              className={cn(
                'border-b border-neutral-300 dark:border-neutral-800',
                sectionIndex === 0 && 'border-t-0',
              )}
            >
              <div className='px-4 pt-3 pb-1.5 text-[9px] uppercase tracking-[0.2em] text-neutral-500'>
                {startStr}–{endStr}
              </div>
              <ul>
                {section.items.map((item) => {
                  runningIndex += 1
                  const idx = String(runningIndex).padStart(2, '0')
                  return (
                    <li key={item.title}>
                      <a
                        href={item.href}
                        className={cn(
                          'relative flex items-center gap-3 px-4 py-2 text-[12px] uppercase tracking-[0.1em] transition-colors',
                          'hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'size-2 shrink-0',
                            item.active ? 'block' : 'invisible',
                          )}
                          style={{ backgroundColor: BRAUN_ORANGE }}
                        />
                        <span className='w-6 text-neutral-500'>{idx}</span>
                        <span className='text-neutral-400'>—</span>
                        <span
                          className={cn(
                            'flex-1 truncate',
                            item.active && 'font-bold',
                          )}
                        >
                          {item.title}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className='border-t-2 border-neutral-900 dark:border-neutral-100'>
        <div className='flex items-center justify-between px-4 py-3'>
          <div className='leading-tight'>
            <div className='text-[9px] uppercase tracking-[0.2em] text-neutral-500'>
              Operator
            </div>
            <div className='text-[11px] uppercase tracking-[0.15em]'>
              {mockUser.name}
            </div>
          </div>
          <div
            className='size-2'
            style={{ backgroundColor: BRAUN_ORANGE }}
            aria-hidden
          />
        </div>
      </div>
    </aside>
  )
}

function BraunDial() {
  return (
    <svg
      width='32'
      height='32'
      viewBox='0 0 32 32'
      className='shrink-0'
      aria-hidden
    >
      <circle
        cx='16'
        cy='16'
        r='14'
        fill='none'
        stroke='currentColor'
        strokeWidth='1'
      />
      <circle
        cx='16'
        cy='16'
        r='9'
        fill='none'
        stroke='currentColor'
        strokeWidth='1'
      />
      <line
        x1='16'
        y1='3'
        x2='16'
        y2='7'
        stroke={BRAUN_ORANGE}
        strokeWidth='2'
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1='16'
          y1='1.5'
          x2='16'
          y2='3'
          stroke='currentColor'
          strokeWidth='0.6'
          transform={`rotate(${deg} 16 16)`}
          opacity={deg === 0 ? 0 : 0.5}
        />
      ))}
    </svg>
  )
}
