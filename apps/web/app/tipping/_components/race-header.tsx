import CountryFlag from '@/components/country-flag'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Database } from '@/db/types'

export function RaceHeader({
  title,
  race,
  description,
}: {
  title: React.ReactNode
  race: Pick<Database.Race, 'country'>
  description?: React.ReactNode
}) {
  return (
    <CardHeader className='flex gap-2 justify-between items-center'>
      <div className='flex flex-col gap-2'>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {race && <CountryFlag country={race.country} />}
    </CardHeader>
  )
}
