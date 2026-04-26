import { Database } from '@/db/types'

export function getDriverName(
  driver: Pick<Database.Driver, 'givenName' | 'familyName'>,
) {
  return [driver.givenName, driver.familyName].filter(Boolean).join(' ')
}
