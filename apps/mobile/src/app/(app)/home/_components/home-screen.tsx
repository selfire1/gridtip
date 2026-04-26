import { View } from 'react-native'
import TipForm, { TipFormDefaultValues } from './tip-form'
import { Constructor, Driver, Group, Race } from '@/types'
import Header from './header'
import { GetTipsResponse } from '@gridtip/shared/api-types'
import { useMemo } from 'react'
import { isConstructorPosition, isDriverPosition } from '@gridtip/shared/constants'
import { Session } from '@/hooks/use-dal'

export default function HomeScreen({
  nextRace,
  apiTips,
  constructors,
  drivers,
  groups,
  session,
  isTipsPending,
}: {
  nextRace: Race
  apiTips: GetTipsResponse | undefined
  constructors: Constructor[]
  drivers: Driver[]
  groups: Group[]
  session: Session
  isTipsPending: boolean
}) {
  const defaultValues = useMemo<TipFormDefaultValues>(() => {
    if (!apiTips) {
      return undefined
    }

    const defaultValues = Object.entries(apiTips).reduce((acc, [key, value]) => {
      if (isDriverPosition(key)) {
        const driver = drivers.find((driver) => driver.id === value.id)!
        // TODO: error tracking if something goes wrong here
        acc[key] = driver
        return acc
      }
      if (isConstructorPosition(key)) {
        const constructor = constructors.find((constructor) => constructor.id === value.id)!
        // TODO: error tracking if something goes wrong here
        acc[key] = constructor
        return acc
      }
      // TODO: error tracking if something goes wrong here (this should never be reaced)
      return acc
    }, {} as NonNullable<TipFormDefaultValues>)
    return defaultValues
  }, [apiTips, drivers, constructors])

  return (
    <View className="flex flex-col gap-8 pb-8">
      <Header race={nextRace} />
      <TipForm
        key={isTipsPending ? 'pending' : 'loaded'}
        session={session}
        defaultValues={defaultValues}
        race={nextRace}
        constructors={constructors}
        drivers={drivers}
        groups={groups}
        isPending={isTipsPending}
      />
    </View>
  )
}
