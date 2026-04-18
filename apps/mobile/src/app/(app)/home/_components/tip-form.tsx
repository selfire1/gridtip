import { Race, Constructor, Driver, Group } from '@/types'
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import PositionModal from './position-modal'
import { DriverOption } from './driver-list'
import { ConstructorOption } from './constructor-list'
import { api } from '@/lib/api'
import { type Position, getFormFields } from '@gridtip/shared/get-form-fields'
import { useSession } from '@/lib/ctx'
import Spinner from '@/components/spinner'
import { Icon } from '@/components/ui/icon'
import { LucideAlertTriangle, LucideCheck } from 'lucide-react-native'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type TipFormState = Record<
  Position['name'],
  | {
      id: Constructor['id'] | undefined
      value: Constructor | undefined
    }
  | {
      id: Driver['id'] | undefined
      value: Driver | undefined
    }
>

export default function TipForm({
  race,
  constructors,
  drivers,
  groups,
  defaultValues,
}: {
  race: Race
  constructors: Constructor[]
  drivers: Driver[]
  groups: Group[]
  defaultValues: Record<Position['name'], Constructor | Driver> | undefined
}) {
  const { session } = useSession()

  const formFields = getFormFields(race.isSprint)
  const [isPresented, setIsPresented] = useState(false)
  const [submissionState, setSubmissionState] = useState<SavingState | null>(null)
  const [isSavingModalPresented, setIsSavingModalPresented] = useState(false)

  const [modalState, setModalState] = useState<{
    position?: Position
  }>()

  const [formState, setFormState] = useState<TipFormState>(
    formFields.reduce((acc, field) => {
      const defaultValue = defaultValues?.[field.name]
      if (defaultValue) {
        acc[field.name] = {
          id: defaultValue.id as Constructor['id'],
          value: defaultValue as Constructor,
        }
        return acc
      }
      return acc
    }, {} as TipFormState),
  )

  const selectedPosition = useMemo(() => {
    return modalState?.position?.name
  }, [modalState])

  const setFieldValue = useCallback(
    (id: string | undefined, field: Position | undefined) => {
      if (!field) {
        // TODO: error tracking / user feedback
        return
      }
      const key = field.name
      const value =
        field.type === 'constructor'
          ? constructors.find((c) => c.id === id)
          : drivers.find((d) => d.id === id)
      setFormState((prev) => ({
        ...prev,
        [key]: {
          id,
          type: field.type,
          value,
        },
      }))
    },
    [constructors, drivers],
  )

  return (
    <>
      <SavingDialog
        savingState={submissionState!}
        isOpen={isSavingModalPresented}
        dismiss={() => setIsSavingModalPresented(false)}
      />
      <PositionModal
        selectedId={selectedPosition ? formState?.[selectedPosition]?.id : undefined}
        setSelectedId={(id) => {
          setFieldValue(id, modalState?.position)
        }}
        isPresented={isPresented}
        dismiss={dismissModal}
        position={modalState?.position}
        constructors={constructors}
        drivers={drivers}
      />
      <View className="mx-4 flex flex-col gap-6">
        {formFields.map((field) => (
          <View key={field.name} className="flex flex-col gap-2">
            <Label className="px-2">{field.label}</Label>
            <Button onPress={() => openModal(field)} variant="outline">
              <FieldContent field={field} />
            </Button>
            <Text className="px-2 text-sm text-muted-foreground">{field.description}</Text>
          </View>
        ))}
        <Button className="mt-4" onPress={onSubmit}>
          <Text>Submit</Text>
        </Button>
      </View>
    </>
  )

  function onSubmit() {
    setIsSavingModalPresented(true)
    onSubmitAsync()

    async function onSubmitAsync() {
      return await Promise.all(
        groups.map(async (group) => {
          setSubmissionState((prev) => ({
            ...prev,
            [group.group.id]: {
              status: 'pending',
              group: group.group,
            },
          }))
          const submitObject = { ...(formState ?? {}), groupId: group.group.id, raceId: race.id }
          const response = await api<{ ok: boolean; message: string }>('tips/submit', session, {
            method: 'POST',
            body: JSON.stringify(submitObject),
          })

          setSubmissionState((prev) => ({
            ...prev,
            [group.group.id]: {
              status: response.ok ? 'success' : 'error',
              group: group.group,
            },
          }))
          return null
        }),
      )
    }
  }

  function openModal(position: Position) {
    setModalState({ position })
    setIsPresented(true)
  }

  function dismissModal() {
    setIsPresented(false)
    setTimeout(() => {
      setModalState(undefined)
    }, 500)
  }

  function FieldContent({ field }: { field: Position }) {
    const value = formState[field.name]?.value
    if (!value) {
      return <Text>Select {field.type}</Text>
    }
    if (field.type === 'driver') {
      return (
        <DriverOption
          driver={formState[field.name].value as Driver}
          isSelected={false}
          className="w-full mr-auto"
        />
      )
    }

    if (field.type === 'constructor') {
      return (
        <ConstructorOption
          constructor={formState[field.name].value as Constructor}
          isSelected={false}
          className="w-full mr-auto"
        />
      )
    }
  }
}

type SavingState = Record<
  Group['group']['id'],
  {
    status: 'pending' | 'success' | 'error'
  } & Group
>
function SavingDialog({
  isOpen,
  savingState,
  dismiss,
}: {
  isOpen: boolean
  savingState: SavingState | null
  dismiss: () => void
}) {
  const isAnyPending = useMemo(
    () => Object.values(savingState ?? {}).some((state) => state.status === 'pending'),
    [savingState],
  )
  if (!savingState) {
    return
  }

  return (
    <Dialog open={isOpen} onOpenChange={dismiss}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Your tips</DialogTitle>
        </DialogHeader>
        <View className="flex flex-col gap-2">
          {Object.values(savingState).map(({ group, status }) => {
            return (
              <View key={group.id} className="flex flex-row items-center justify-between gap-3">
                <View className="flex flex-row items-center gap-2">
                  <StatusIcon />
                  <Text className="font-medium">{group.name}</Text>
                </View>
                <StatusText />
              </View>
            )

            function StatusText() {
              switch (status) {
                case 'pending': {
                  return <Text>Saving…</Text>
                }
                case 'success': {
                  return <Text className="text-green-600 dark:text-green-800">Saved</Text>
                }
                case 'error': {
                  return <Text className="text-amber-600 dark:text-amber-800">Error</Text>
                }
              }
            }

            function StatusIcon() {
              switch (status) {
                case 'pending': {
                  return <Spinner className="text-muted-foreground" />
                }
                case 'success': {
                  return <Icon className="text-muted-foreground" as={LucideCheck} />
                }
                case 'error': {
                  return <Icon className="text-muted-foreground" as={LucideAlertTriangle} />
                }
              }
            }
          })}
        </View>
        <DialogFooter>
          <DialogClose asChild disabled={isAnyPending}>
            <Button>
              <Text>Close</Text>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
