import { cn } from '@/lib/utils'
import { mockGroup, mockUser, navSections } from './mock-data'

const TEAM_COLORS = [
  'rgb(var(--clr-team-ferrari))',
  'rgb(var(--clr-team-mercedes))',
  'rgb(var(--clr-team-mclaren))',
  'rgb(var(--clr-team-red_bull))',
  'rgb(var(--clr-team-aston_martin))',
  'rgb(var(--clr-team-alpine))',
  'rgb(var(--clr-team-williams))',
  'rgb(var(--clr-team-haas))',
]

const carbonFibre = {
  backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 4px)`,
}

export function VariationRacing() {
  let position = 0

  return (
    <aside
      className='flex h-full w-64 flex-col bg-zinc-950 font-mono text-zinc-100'
      style={carbonFibre}
    >
      <div className='border-b border-zinc-800'>
        <div className='h-1 w-full bg-[#e10600]' />
        <div className='flex items-center gap-2 px-3 py-3'>
          <span className='relative flex size-2'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/75' />
            <span className='relative inline-flex size-2 rounded-full bg-red-500' />
          </span>
          <div className='flex-1 truncate text-[11px] font-bold uppercase tracking-[0.2em]'>
            {mockGroup.name}
          </div>
          <span className='rounded-sm bg-[#e10600] px-1.5 py-0.5 text-[9px] font-bold tracking-widest'>
            LIVE
          </span>
        </div>
      </div>

      <nav className='flex-1 overflow-y-auto'>
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className='py-1'>
            {sectionIndex > 0 && <CheckeredDivider />}
            <div className='flex items-center gap-2 px-3 pt-2 pb-1.5'>
              <div className='h-px flex-1 bg-zinc-800' />
              <span className='text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500'>
                {section.title}
              </span>
              <div className='h-px flex-1 bg-zinc-800' />
            </div>
            <ul>
              {section.items.map((item) => {
                position += 1
                const teamColor = TEAM_COLORS[(position - 1) % TEAM_COLORS.length]
                const pos = `P${String(position).padStart(2, '0')}`
                return (
                  <li key={item.title} className='relative'>
                    {item.active && (
                      <span className='absolute left-0 top-0 h-full w-[3px] bg-[#e10600]' />
                    )}
                    <a
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-2 px-3 py-2 transition-colors',
                        'hover:bg-white/[0.04]',
                        item.active && 'bg-red-600/15',
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono text-[10px] font-bold tabular-nums',
                          item.active ? 'text-[#e10600]' : 'text-zinc-500',
                        )}
                      >
                        {pos}
                      </span>
                      <item.icon className='size-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-100' />
                      <span
                        className={cn(
                          'flex-1 truncate text-[11px] uppercase tracking-[0.12em]',
                          item.active && 'font-bold',
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className='h-4 w-[3px] shrink-0'
                        style={{ backgroundColor: teamColor }}
                        aria-hidden
                      />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className='border-t border-zinc-800 bg-black/40 p-3'>
        <div className='text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500'>
          Driver Card
        </div>
        <div className='mt-2 flex items-center gap-2'>
          <div className='flex size-9 items-center justify-center rounded-sm border border-[#e10600]/60 bg-zinc-900 text-[10px] font-bold'>
            {mockUser.initials}
          </div>
          <div className='flex-1 overflow-hidden leading-tight'>
            <div className='truncate text-[11px] font-bold uppercase tracking-[0.12em]'>
              {mockUser.name}
            </div>
            <div className='truncate text-[9px] uppercase tracking-[0.2em] text-zinc-500'>
              No. 44 &middot; GBR
            </div>
          </div>
        </div>
        <TrackMap />
      </div>
    </aside>
  )
}

function CheckeredDivider() {
  return (
    <div className='flex h-2 items-center gap-px overflow-hidden px-3'>
      {Array.from({ length: 32 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1 flex-1',
            i % 2 === 0 ? 'bg-zinc-700' : 'bg-zinc-900',
          )}
        />
      ))}
    </div>
  )
}

function TrackMap() {
  return (
    <svg
      viewBox='0 0 200 40'
      className='mt-2 h-6 w-full text-[#e10600]/70'
      aria-hidden
    >
      <path
        d='M5,25 C20,5 40,5 55,20 C70,35 90,35 110,25 C130,15 150,10 170,18 C185,24 195,22 195,15'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <circle cx='5' cy='25' r='2' fill='currentColor' />
    </svg>
  )
}
