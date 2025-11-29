import { cn } from '@/lib/utils'
import { getCountryFlag } from '@/lib/utils/country-flag'
import clsx from 'clsx'
import Image from 'next/image'

export default function CountryFlag({
  country,
  isEager = true,
  className,
}: {
  country: string
  isEager?: boolean
  className?: string
}) {
  return (
    <Image
      width={200}
      height={200}
      fetchPriority={isEager ? 'high' : 'auto'}
      loading={isEager ? 'eager' : 'lazy'}
      className={cn('size-12 object-cover rounded-full border-2', className)}
      alt={`Flag of ${country}`}
      src={getCountryFlag(country)}
    />
  )
}
