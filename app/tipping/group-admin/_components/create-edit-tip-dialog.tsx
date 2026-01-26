'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue as ShadSelectValue,
} from '@/components/ui/select'
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
import { RACE_PREDICTION_FIELDS, RacePredictionField } from '@/constants'
import { Database } from '@/db/types'
import {
  getIsSprint,
  getLabel,
  getTipTypeFromPosition,
  TipType,
} from '@/lib/utils/prediction-fields'
import { zodResolver } from '@hookform/resolvers/zod'
import { isFuture } from 'date-fns'
import {
  LucideCheckCircle,
  LucideInfo,
  LucidePlus,
  LucideTriangleAlert,
  LucideXCircle,
} from 'lucide-react'
import React from 'react'
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  useForm,
} from 'react-hook-form'
import { createTip, updateTip } from '../_utils/create-tip-action'
import { toast } from 'sonner'
import AppButton from '@/components/button'
import { formSchema, Schema } from '../_utils/schema'
import { useRouter } from 'next/navigation'
import { SelectUser } from './select-user'
import { TIP_OVERWRITE_OPTIONS } from '@/db/schema/schema'
import { Icon } from '@/components/icon'

type RaceOption = Pick<
  Database.Race,
  'id' | 'locality' | 'grandPrixDate' | 'sprintQualifyingDate'
>

export type TipFormData = {
  users: Pick<Database.User, 'id' | 'name'>[]
  drivers: DriverOptionProps[]
  constructors: ConstructorProps[]
  races: RaceOption[]
}

type TipFormProps = TipFormData & {
  defaultValues?: Partial<Schema>
  button?: React.ReactNode
  predictionEntryId?: Database.PredictionEntryId
}

export default function CreateOrEditTipDialog({
  users,
  races,
  drivers,
  constructors,
  defaultValues,
  predictionEntryId,
  button = (
    <AppButton
      variant='outline'
      size='sm'
      icon={LucidePlus}
      label='Create tip'
    />
  ),
}: TipFormProps) {
  const form = useForm<Schema>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const router = useRouter()

  const mode = !Object.values(defaultValues ?? {})?.length ? 'create' : 'edit'
  const isEditing = mode === 'edit'

  const copy = getCopy()

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

  const [tipType, setTipType] = React.useState<TipType>(
    defaultValues?.position
      ? getTipTypeFromPosition(defaultValues.position)
      : 'driver',
  )

  const [message, setMessage] = React.useState<{
    title: string
    description?: string
    isError?: boolean
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
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title[mode]}</DialogTitle>
          <DialogDescription>{copy.description[mode]}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <SelectTipper />
            <SelectRace />
            <SelectPosition />
            <SelectValue />
            <FormField
              name='overwriteTo'
              label='Score as'
              renderItem={({ field }) => (
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className='w-[180px]'>
                    <ShadSelectValue placeholder='Select' />
                  </SelectTrigger>
                  <SelectContent>
                    {getSelectOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.icon && (
                          <option.icon className={option.className} />
                        )}
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FieldGroup>
          {message && (
            <Alert
              className='mt-4'
              variant={message.isError ? 'destructive' : 'default'}
              title={message.title}
              description={message.description}
              icon={message.isError ? LucideTriangleAlert : LucideInfo}
            />
          )}

          <Field className='mt-4'>
            <div className='flex justify-between gap-2'>
              <AppButton
                label='Cancel'
                type='button'
                onClick={() => setOpen(false)}
                variant='outline'
              />
              <AppButton
                label={copy.button[mode]}
                type='submit'
                isPending={isPending}
                variant='default'
                onClick={() => {
                  form.handleSubmit(onSubmit)
                }}
              />
            </div>
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  )

  function getSelectOptions() {
    const options = [
      {
        label: 'Normal',
        value: 'normal',
      },
      {
        label: 'Correct',
        value: 'countAsCorrect',
        className: 'text-success',
        icon: Icon.CorrectTip,
      },
      {
        label: 'Incorrect',
        value: 'countAsIncorrect',
        className: 'text-destructive',
        icon: Icon.IncorrectTip,
      },
    ] satisfies ({
      value: (typeof TIP_OVERWRITE_OPTIONS)[number] | 'normal'
      label: string
    } & Record<string, any>)[]

    return options
  }

  function onPositionChange(position: RacePredictionField | undefined) {
    if (!position) {
      setTipType('driver')
      return
    }
    const type = getTipTypeFromPosition(position)
    setTipType(type)
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
        description: `Are you sure you want to ${mode === 'create' ? 'set a tip for it' : 'edit the tip for it'}?`,
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
              disabled={isEditing}
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
              renderItem={(driver) =>
                [driver.givenName, driver.familyName].join(' ')
              }
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
            <SelectUser
              users={users}
              value={field.value}
              onSelect={field.onChange}
              disabled={isEditing}
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
            disabled={isEditing}
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
      const response = await getResponse()
      if (!response.ok) {
        setMessage({
          title: 'Did not save',
          description: response.message,
          isError: true,
        })
        return
      }
      toast.success(copy.toast[mode])
      setOpen(false)
      router.refresh()
      return

      async function getResponse() {
        if (isEditing) {
          return await handleIsEditing()
        }
        return await createTip(data)

        async function handleIsEditing() {
          if (!predictionEntryId) {
            return {
              ok: false,
              message: 'Tip does not seem to exist',
            }
          }
          return await updateTip(predictionEntryId, data)
        }
      }
    })
  }

  function getCopy() {
    return {
      title: {
        create: 'Create new tip',
        edit: 'Update tip',
      },
      description: {
        create: 'Create a tip on behalf of a member of the group.',
        edit: 'Change this existing tip',
      },
      button: {
        create: 'Save',
        edit: 'Save',
      },
      toast: {
        create: 'Tip created',
        edit: 'Tip updated',
      },
    } as const
  }
}
