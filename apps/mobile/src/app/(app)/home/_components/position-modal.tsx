import { Text } from '@/components/ui/text'
import { Modal, ScrollView, View } from 'react-native'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { Input } from '@/components/ui/input'
import { Constructor, Driver } from '@/types'
import DriverList from './driver-list'
import ConstructorList from './constructor-list'
import { Position } from './tip-form'

export default function PositionModal({
  position,
  isPresented,
  dismiss,
  constructors,
  drivers,
  selectedId,
  setSelectedId,
}: {
  position?: Position
  isPresented: boolean
  dismiss: () => void
  constructors: Constructor[]
  drivers: Driver[]
  selectedId: Constructor['id'] | Driver['id'] | undefined
  setSelectedId: (id: Constructor['id'] | Driver['id'] | undefined) => void
}) {
  const [query, setQuery] = useState('')

  return (
    <Modal
      visible={isPresented}
      animationType="slide"
      navigationBarTranslucent={true}
      statusBarTranslucent={true}
      presentationStyle="formSheet"
      className="bg-background"
    >
      <SafeAreaProvider>
        <SafeAreaView>
          <ModalHeader position={position} dismiss={dismiss} />
          <ModalBody
            position={position}
            query={query}
            setQuery={setQuery}
            constructors={constructors}
            drivers={drivers}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )

  function handleSelect(id: Constructor['id'] | Driver['id'] | undefined) {
    setSelectedId(id)
    setQuery('')
    dismiss()
  }
}

function ModalBody({
  position,
  query,
  setQuery,
  constructors,
  drivers,
  selectedId,
  onSelect,
}: {
  position?: Position
  query: string
  setQuery: (query: string) => void
  constructors: Constructor[]
  drivers: Driver[]
  selectedId: Constructor['id'] | Driver['id'] | undefined
  onSelect: (id: Constructor['id'] | Driver['id'] | undefined) => void
}) {
  return (
    <View className="mx-4 my-8 flex flex-col gap-4">
      <Input
        autoFocus={true}
        autoCorrect={false}
        autoComplete="off"
        clearButtonMode="always"
        inputMode="search"
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${position?.type ? position.type + 's' : ''}…`}
      />
      <ScrollView className="mb-48">
        {position?.type === 'constructor' ? (
          <ConstructorList
            selectedConstructorId={selectedId}
            onSelect={onSelect}
            constructors={constructors}
            query={query}
          />
        ) : position?.type === 'driver' ? (
          <DriverList
            drivers={drivers}
            query={query}
            selectedDriverId={selectedId}
            onSelect={onSelect}
          />
        ) : (
          <Text className="text-center text-muted-foreground">No results</Text>
        )}
      </ScrollView>
    </View>
  )
}

function ModalHeader({ position, dismiss }: { position?: Position; dismiss: () => void }) {
  return (
    <View className="bg-muted p-4 flex items-center relative border-b border-border">
      <Text className="font-medium">Select {position?.label ?? 'Position'}</Text>
      <View className="absolute left-4 inset-y-0 flex justify-center">
        <Button onPress={() => dismiss()} variant="ghost">
          <Text>Close</Text>
        </Button>
      </View>
    </View>
  )
}
