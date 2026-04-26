import { Stack } from 'expo-router'
import { Text } from '@/components/ui/text'
import { ScrollView, View } from 'react-native'
import { useCallback, useMemo } from 'react'
import { useSession } from '@/lib/ctx'
import {
  getConstructors,
  getDrivers,
  getMyGroups,
  getMyTips,
  getRaces,
  getUpdatedState,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LucideAlertTriangle } from 'lucide-react-native'
import NoSession from '@/components/no-session'
import { Session } from '@/hooks/use-dal'
import { queryOptions, useQuery } from '@tanstack/react-query'
import HomeScreen from './_components/home-screen'
import { useStaticQuery } from '@/hooks/use-static-query'

export default function HomeScreenWrapper() {
  const { session } = useSession()

  const Content = useCallback(() => {
    if (!session) return <NoSession />
    return <AuthentificatedHomeScreen session={session} />
  }, [session])

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
}

function AuthentificatedHomeScreen({ session }: { session: Session }) {
  const lastUpdatedQuery = useQuery(
    queryOptions({
      queryKey: ['last-updated', session],
      queryFn: () => getUpdatedState(session),
      staleTime: 60 * 1000, // one minute
    }),
  )

  const racesQuery = useStaticQuery('races', lastUpdatedQuery, {
    queryKey: ['races', session],
    queryFn: () => getRaces(session),
  })

  const nextRace = useMemo(() => {
    if (!racesQuery.data?.races.length) return
    return racesQuery.data.races.find((race) => new Date(race.grandPrixDate) > new Date())
  }, [racesQuery.data])

  const driversQuery = useStaticQuery('drivers', lastUpdatedQuery, {
    queryKey: ['drivers', session],
    queryFn: () => getDrivers(session),
  })

  const constructorsQuery = useStaticQuery('constructors', lastUpdatedQuery, {
    queryKey: ['constructors', session],
    queryFn: () => getConstructors(session),
  })

  const groupsQuery = useQuery(
    queryOptions({
      queryKey: ['groups', session],
      queryFn: () => getMyGroups(session),
      staleTime: 30 * 1000, // 30 sec
    }),
  )

  const defaultGroupId = groupsQuery.data?.groups?.[0]?.group.id
  const myTips = useQuery(
    queryOptions({
      queryKey: ['my-tips', session, nextRace?.id, defaultGroupId],
      enabled: !!nextRace?.id && !!defaultGroupId,
      queryFn: () => {
        if (!nextRace?.id || !defaultGroupId) {
          return null
        }
        return getMyTips(session, {
          raceId: nextRace.id,
          groupId: defaultGroupId,
        })
      },
      staleTime: 30 * 1000, // 30 sec
    }),
  )

  // Loading
  if (lastUpdatedQuery.isPending) return <LoadingState message="Loading updates" />
  if (racesQuery.isPending) return <LoadingState message="Loading races" />
  if (driversQuery.isPending) return <LoadingState message="Loading drivers" />
  if (constructorsQuery.isPending) return <LoadingState message="Loading constructors" />
  if (groupsQuery.isPending) return <LoadingState message="Loading groups" />

  // Errors
  if (lastUpdatedQuery.isError) return <ErrorState message={lastUpdatedQuery.error.message} />
  if (!nextRace) return <ErrorState message="No races available" />
  if (!driversQuery.data?.drivers.length) return <ErrorState message="No drivers available" />
  if (!constructorsQuery.data?.constructors.length)
    return <ErrorState message="No constructors available" />
  if (!groupsQuery.data?.groups.length)
    return (
      <ErrorState message="There was an error loading groups, or you haven’t joined a group yet." />
    )

  return (
    <HomeScreen
      session={session}
      nextRace={nextRace}
      drivers={driversQuery.data.drivers}
      constructors={constructorsQuery.data.constructors}
      groups={groupsQuery.data.groups}
      apiTips={myTips.data || undefined}
      isTipsPending={myTips.isFetching}
    />
  )
}

function LoadingState({ message }: { message?: string }) {
  return (
    <View className="mx-4 py-16">
      <View className="flex items-center justify-center gap-2 flex-row">
        <Spinner />
        <Text className="text-muted-foreground">{message ? `${message}…` : 'Loading…'}</Text>
      </View>
    </View>
  )
}

function ErrorState({ message }: { message?: string }) {
  return (
    <View className="mt-8 mx-4">
      <Alert variant="destructive" icon={LucideAlertTriangle}>
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <Text>We could not load the relevant data.</Text>
          {message && <Text className="text-muted-foreground"> {message}</Text>}
        </AlertDescription>
        <Button size="sm" variant="secondary">
          {
            // TODO: add refetch
          }
          <Text>Try again</Text>
        </Button>
      </Alert>
    </View>
  )
}
