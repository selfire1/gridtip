'use client'

import Alert from '@/components/alert'
import { Combobox } from '@/components/combobox'
import { ConstructorProps } from '@/components/constructor'
import { DriverOptionProps } from '@/components/driver-option'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import UserAvatar from '@/components/user-avatar'
import { RACE_PREDICTION_FIELDS, RacePredictionField } from '@/constants'
import { Database } from '@/db/types'
import { getIsSprint, getLabel } from '@/lib/utils/prediction-fields'
import { zodResolver } from '@hookform/resolvers/zod'
import { isFuture } from 'date-fns'
import { LucidePlus, LucideTriangleAlert } from 'lucide-react'
import React from 'react'
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  useForm,
} from 'react-hook-form'
import { createTip } from '../_utils/create-tip-action'
import { toast } from 'sonner'
import Button from '@/components/button'
import { formSchema, Schema } from '../_utils/schema'
import { useRouter } from 'next/navigation'

type RaceOption = Pick<
  Database.Race,
  'id' | 'locality' | 'grandPrixDate' | 'sprintQualifyingDate'
>

export default function CreateTipDialog({
  users,
  races,
  drivers,
  constructors,
}: {
  users: Pick<Database.User, 'id' | 'name'>[]
  drivers: DriverOptionProps[]
  constructors: ConstructorProps[]
  races: RaceOption[]
}) {
  const form = useForm<Schema>({
    resolver: zodResolver(formSchema),
  })

  const router = useRouter()

  const [isPending, startTransition] = React.useTransition()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      form.reset()
      setMessage(undefined)
    }
  }, [open])

  const [availablePositions, setAvailablePositions] = React.useState<
    RacePredictionField[]
  >([...RACE_PREDICTION_FIELDS])

  const [tipType, setTipType] = React.useState<'constructor' | 'driver'>()

  const [message, setMessage] = React.useState<{
    title: string
    description?: string
  }>()

  const sprintRaceIds = new Set(
    races.filter(getIsSprint).map((race) => race.id),
  )

  const futureRaceIds = new Set(
    races.filter((race) => isFuture(race.grandPrixDate)).map((race) => race.id),
  )

  const sortedRaces = React.useMemo(
    () =>
      races.toSorted(
        (a, b) =>
          new Date(b.grandPrixDate).valueOf() -
          new Date(a.grandPrixDate).valueOf(),
      ),
    [races],
  )

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          icon={LucidePlus}
          label='Create tip'
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new tip</DialogTitle>
          <DialogDescription>
            Create a tip on behalf of a member of the group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <SelectTipper />
            <SelectRace />
            <SelectPosition />
            <SelectValue />
          </FieldGroup>
          {message && (
            <Alert
              className='mt-4'
              variant='destructive'
              title={message.title}
              description={message.description}
              icon={LucideTriangleAlert}
            />
          )}

          <Field className='mt-4'>
            <div className='flex justify-end gap-2'>
              <Button
                label='Cancel'
                type='button'
                onClick={() => setOpen(false)}
                variant='outline'
              />
              <Button
                label='Save'
                type='submit'
                isPending={isPending}
                variant='default'
                onClick={() => {
                  console.log('clicked')
                  form.handleSubmit(onSubmit)
                }}
              />
            </div>
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  )

  function onPositionChange(position: RacePredictionField | undefined) {
    if (position === 'constructorWithMostPoints') {
      setTipType('constructor')
      return
    }
    setTipType('driver')
  }

  function onRaceChange(raceId: RaceOption['id'] | undefined) {
    setMessage(undefined)
    if (!raceId) {
      setAvailablePositions([...RACE_PREDICTION_FIELDS])
      return
    }
    const isFuture = futureRaceIds.has(raceId)
    if (isFuture) {
      setMessage({
        title: 'This race is in the future',
        description: 'Are you sure you want to set a tip for it?',
      })
    }

    const isSprintRace = sprintRaceIds.has(raceId)
    if (isSprintRace) {
      setAvailablePositions([...RACE_PREDICTION_FIELDS])
      return
    }
    setAvailablePositions([
      ...RACE_PREDICTION_FIELDS.filter((pos) => pos !== 'sprintP1'),
    ])
  }

  function SelectPosition() {
    return (
      <FormField
        name='position'
        label='Type of tip'
        renderItem={({ field }) => {
          return (
            <Combobox
              items={availablePositions.map((field) => ({ id: field }))}
              value={field.value}
              onSelect={(value) => {
                field.onChange(value)
                onPositionChange(value)
              }}
              getSearchValue={({ id }) => getLabel(id)}
              emptyText='Select position'
              renderItem={(position) => getLabel(position.id)}
            />
          )
        }}
      />
    )
  }
  function SelectValue() {
    return (
      <FormField
        name='valueId'
        label='Prediction'
        renderItem={({ field }) => {
          if (tipType === 'constructor') {
            return (
              <Combobox
                items={constructors}
                value={field.value}
                onSelect={field.onChange}
                getSearchValue={(constructor) => constructor.name}
                renderItem={(constructor) => constructor.name}
              />
            )
          }
          return (
            <Combobox
              items={drivers}
              value={field.value}
              onSelect={field.onChange}
              getSearchValue={(driver) =>
                [driver.givenName, driver.familyName].join(' ')
              }
              renderItem={(driver) => driver.familyName}
            />
          )
        }}
      />
    )
  }

  function SelectTipper() {
    return (
      <FormField
        name='userId'
        label='Tipper'
        renderItem={({ field }) => {
          return (
            <Combobox
              items={users}
              value={field.value}
              onSelect={field.onChange}
              getSearchValue={(user) => user.name}
              placeholder='Search users…'
              emptyText='Select a user'
              renderItem={(user) => (
                <div className='flex items-center gap-2'>
                  <UserAvatar
                    name={user.name}
                    id={user.id}
                    className='size-6'
                  />
                  <p>{user.name}</p>
                </div>
              )}
            />
          )
        }}
      />
    )
  }

  function FormField<TKey extends keyof Schema>({
    name,
    label,
    description,
    renderItem,
  }: {
    name: TKey
    label: string
    description?: string
    renderItem: (formContext: {
      field: ControllerRenderProps<Schema, TKey>
      fieldState: ControllerFieldState
    }) => React.ReactNode
  }) {
    return (
      <Controller
        name={name}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field orientation='responsive' data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
              {description && (
                <FieldDescription>{description}</FieldDescription>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
            {renderItem({ field, fieldState })}
          </Field>
        )}
      />
    )
  }

  function SelectRace() {
    return (
      <FormField
        name='raceId'
        label='Race'
        renderItem={({ field }) => (
          <Combobox
            items={sortedRaces}
            value={field.value}
            onSelect={(raceId) => {
              field.onChange(raceId)
              setTimeout(() => {
                onRaceChange(raceId)
              }, 200)
            }}
            getSearchValue={(race) => race.locality}
            placeholder='Search races…'
            emptyText='Select race'
            renderItem={(race) => race.locality}
          />
        )}
      />
    )
  }

  async function onSubmit(data: Schema) {
    setMessage(undefined)
    startTransition(async () => {
      const response = await createTip(data)
      if (!response.ok) {
        setMessage({
          title: 'Did not save',
          description: response.message,
        })
        return
      }
      toast.success('Tip created')
      setOpen(false)
      router.refresh()
      return
    })
  }
}
