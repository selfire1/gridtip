import { Stack } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { linkItems, openLink } from '../../../lib/link-items'

export default function LinksScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Links' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="mt-4 mx-4 rounded-xl bg-card border border-border overflow-hidden">
          {linkItems.map((item, index) => {
            const Icon = item.icon
            const isLast = index === linkItems.length - 1
            return (
              <Pressable
                key={item.routeKey}
                onPress={() => openLink(item.routeKey)}
                className="active:bg-accent"
              >
                <View
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${
                    isLast ? '' : 'border-b border-border'
                  }`}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon size={20} className="text-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium">{item.title}</Text>
                    <Text variant="muted" className="text-xs mt-0.5">
                      {item.description}
                    </Text>
                  </View>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </View>
              </Pressable>
            )
          })}
        </View>
        <View className="h-8" />
      </ScrollView>
    </>
  )
}
