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
      className={clsx('size-12 object-cover rounded-full border-2', className)}
      alt={`Flag of ${country}`}
      src={getCountryFlag(country)}
    />
  )
}

function getCountryFlag(countryCode: string) {
  const COUNTRY_FLAGS: Record<string, string> = {
    Australia:
      'https://upload.wikimedia.org/wikipedia/en/b/b9/Flag_of_Australia.svg',
    China:
      'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flag_of_the_People%27s_Republic_of_China.svg',
    Japan: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg',
    Bahrain:
      'https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Bahrain.svg',
    'Saudi Arabia':
      'https://upload.wikimedia.org/wikipedia/commons/0/0d/Flag_of_Saudi_Arabia.svg',
    USA: 'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg',
    Italy: 'https://upload.wikimedia.org/wikipedia/en/0/03/Flag_of_Italy.svg',
    Monaco:
      'https://upload.wikimedia.org/wikipedia/commons/e/ea/Flag_of_Monaco.svg',
    Spain: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg',
    Canada: 'https://upload.wikimedia.org/wikipedia/en/c/cf/Flag_of_Canada.svg',
    Austria:
      'https://upload.wikimedia.org/wikipedia/commons/4/41/Flag_of_Austria.svg',
    UK: 'https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg',
    Belgium:
      'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Belgium.svg',
    Hungary:
      'https://upload.wikimedia.org/wikipedia/commons/c/c1/Flag_of_Hungary.svg',
    Netherlands:
      'https://upload.wikimedia.org/wikipedia/commons/2/20/Flag_of_the_Netherlands.svg',
    Azerbaijan:
      'https://upload.wikimedia.org/wikipedia/commons/d/dd/Flag_of_Azerbaijan.svg',
    Singapore:
      'https://upload.wikimedia.org/wikipedia/commons/4/48/Flag_of_Singapore.svg',
    Mexico:
      'https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg',
    Brazil: 'https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg',
    'United States':
      'https://upload.wikimedia.org/wikipedia/en/a/a4/Flag_of_the_United_States.svg',
    Qatar:
      'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Qatar.svg',
    UAE: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_the_United_Arab_Emirates.svg',
  }
  return COUNTRY_FLAGS[countryCode]
}
