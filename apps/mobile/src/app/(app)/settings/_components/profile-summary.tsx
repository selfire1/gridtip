import { View } from 'react-native'
import { Image } from 'expo-image'
import { Text } from '@/components/ui/text'
import Spinner from '@/components/spinner'
import { useSession } from '@/lib/ctx'
import { getMe } from '@/lib/api'
import { getWebUrl } from '@/lib/url'
import { queryOptions, useQuery } from '@tanstack/react-query'

const AVATAR_SIZE = 48

export default function ProfileSummary() {
  const { session } = useSession()

  const meQuery = useQuery(
    queryOptions({
      queryKey: ['me', session],
      queryFn: () => getMe(session!),
      enabled: !!session,
      staleTime: 5 * 60 * 1000,
    }),
  )

  if (meQuery.isPending) {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Spinner />
        <Text variant="muted">Loading profile…</Text>
      </View>
    )
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <View className="px-4 py-3">
        <Text variant="muted">Could not load profile</Text>
      </View>
    )
  }

  const { name, email, avatarUrl } = meQuery.data
  const imageUrl = avatarUrl ?? facehashUrl(name)

  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Image
        source={imageUrl}
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 8 }}
        contentFit="cover"
        accessibilityLabel={name}
        className="rounded-full overflow-hidden"
      />
      <View className="flex-1">
        <Text className="text-base font-semibold" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="muted" className="text-xs mt-0.5" numberOfLines={1}>
          {email}
        </Text>
      </View>
    </View>
  )
}

function facehashUrl(name: string) {
  return getWebUrl(`/api/v1/avatar?name=${encodeURIComponent(name)}`)
}
