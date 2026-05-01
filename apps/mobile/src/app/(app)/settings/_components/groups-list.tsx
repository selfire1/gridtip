import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import Spinner from '@/components/spinner'
import { IconFromName } from '@/components/icon-from-name'
import { useSession } from '@/lib/ctx'
import { getMyGroups } from '@/lib/api'
import { queryOptions, useQuery } from '@tanstack/react-query'

export default function GroupsList() {
  const { session } = useSession()

  const groupsQuery = useQuery(
    queryOptions({
      queryKey: ['groups', session],
      queryFn: () => getMyGroups(session!),
      enabled: !!session,
      staleTime: 30 * 1000,
    }),
  )

  if (groupsQuery.isPending) {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Spinner />
        <Text variant="muted">Loading groups…</Text>
      </View>
    )
  }

  if (groupsQuery.isError) {
    return (
      <View className="px-4 py-3">
        <Text variant="muted">Could not load groups</Text>
      </View>
    )
  }

  const groups = groupsQuery.data?.groups ?? []

  if (groups.length === 0) {
    return (
      <View className="px-4 py-3">
        <Text variant="muted" className="text-sm">
          You haven&apos;t joined a group yet.
        </Text>
      </View>
    )
  }

  return (
    <View>
      {groups.map((entry, index) => {
        const { group } = entry
        const isLast = index === groups.length - 1
        return (
          <View
            key={group.id}
            className={`flex-row items-center gap-3 px-4 py-3 ${
              isLast ? '' : 'border-b border-border'
            }`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <IconFromName
                iconName={group.iconName}
                fallback="lucide:users"
                size={18}
                className="text-foreground"
              />
            </View>
            <Text className="flex-1 text-base font-medium" numberOfLines={1}>
              {group.name}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
