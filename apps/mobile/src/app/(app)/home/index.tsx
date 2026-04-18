import { Stack } from 'expo-router'
import { Text } from '@/components/ui/text'
import { ScrollView, View } from 'react-native'
import { useEffect, useState } from 'react'
import { useSession } from '@/lib/ctx'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LucideAlertTriangle } from 'lucide-react-native'
import { Constructor, Driver, Group, Race } from '@/types'
import TipForm, { Position } from './_components/tip-form'
import Header from './_components/header'

export default function HomeScreen() {
  const [nextRace, setNextRace] = useState<Race>()
  const [groups, setGroups] = useState<Group[]>()
  const [defaultFormState, setDefaultFormState] =
    useState<Record<Position['name'], Constructor | Driver>>()
  const [items, setItems] = useState<{ constructors: Constructor[]; drivers: Driver[] }>()
  const [fetchState, setFetchState] = useState<'error' | 'pending' | 'success'>()
  const [fetchKey, setFetchKey] = useState(Date.now())
  const { session } = useSession()

  useEffect(() => {
    setFetchState('pending')
    loadInitialState()
      .then(({ race, constructors, drivers, groups, defaultValues }) => {
        setNextRace(race)
        setItems({ constructors, drivers })
        setGroups(groups)
        setFetchState('success')
        setDefaultFormState(defaultValues)
      })
      .catch(() => {
        setFetchState('error')
      })
  }, [session, fetchKey])

  function refetch() {
    setFetchKey(Date.now())
  }

  function Content() {
    if (fetchState === 'pending') {
      return (
        <View className="mx-4 py-16">
          <View className="flex items-center justify-center gap-2 flex-row">
            <Spinner />
            <Text>Loading…</Text>
          </View>
        </View>
      )
    }
    if (fetchState === 'error' || !nextRace || !groups || !items) {
      return (
        <View className="mt-8 mx-4">
          <Alert variant="destructive" icon={LucideAlertTriangle}>
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>We could not load the relevant data.</AlertDescription>
            <Button onPress={refetch} size="sm" variant="secondary">
              <Text>Try again</Text>
            </Button>
          </Alert>
        </View>
      )
    }
    return (
      <>
        <View className="flex flex-col gap-8 pb-8">
          <Header race={nextRace} />
          <TipForm
            defaultValues={defaultFormState}
            race={nextRace}
            constructors={items.constructors}
            drivers={items.drivers}
            groups={groups}
          />
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Home', headerTitle: 'Home' }} />
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <ScrollView>
          <Content />
        </ScrollView>
      </View>
    </>
  )

  async function loadInitialState() {
    const [{ race, constructors, drivers }, { groups }] = await Promise.all([
      api<{ race: Race; constructors: Constructor[]; drivers: Driver[] }>(
        'tips/form-details',
        session,
      ),
      api<{ groups: Group[] }>('my/groups', session),
    ])

    const params = new URLSearchParams({
      raceId: race?.id?.toString() ?? '',
      groupId: groups[0].group.id.toString(),
    }).toString()

    const url = `tips/get?${params}`

    const defaultValuesResponse = await api<
      { error: string } | Record<Position['name'], Driver | Constructor>
    >(url, session)
    if ('error' in defaultValuesResponse && defaultValuesResponse.error) {
      console.error(defaultValuesResponse)
      throw new Error(defaultValuesResponse.error)
    }

    return {
      race,
      constructors,
      drivers,
      groups,
      defaultValues: defaultValuesResponse as Record<Position['name'], Driver | Constructor>,
    }
  }
}
