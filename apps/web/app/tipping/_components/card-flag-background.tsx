import { Card } from '@/components/ui/card'
import { Database } from '@/db/types'
import { getCountryFlag } from '@/lib/utils/country-flag'
import { ReactNode } from 'react'

export function FlagBackgroundCard({
  race,
  children,
}: {
  race: Pick<Database.Race, 'country'> | undefined
  children: ReactNode
}) {
  return (
    <Card className='relative isolate overflow-hidden'>
      {race && (
        <div className='absolute inset-0 overflow-hidden z-[-1] blur-3xl'>
          <div className='absolute inset-0 bg-gradient-to-br from-card/85 to-card' />
          <img alt='' src={getCountryFlag(race.country)} />
        </div>
      )}
      {children}
    </Card>
  )
}
