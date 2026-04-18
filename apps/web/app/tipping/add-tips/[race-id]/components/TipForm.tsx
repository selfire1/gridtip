'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { SelectDriver } from '@/components/select-driver'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { submitChanges } from '../actions/submit-tip'
import { LucideCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/db/types'
import { submitTipSchema } from '../actions/schema'
import { ConstructorProps } from '@/components/constructor'
import { DriverOptionProps as DriverOption } from '@/components/driver-option'
import { SelectConstructor } from '@/components/select-constructor'
import { getFormFields } from '@/lib/utils/tip-fields'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'
import * as Sentry from '@sentry/nextjs'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const formSchema = submitTipSchema.partial()
export type Schema = z.infer<typeof formSchema>

type UserGroup = Pick<Database.Group, 'id' | 'name'>
export default function TipForm({
  drivers,
  constructors,
  isSprint,
  disabledFields,
  defaultValues,
  isFormDisabled,
  race,
  userGroups,
}: {
  drivers: DriverOption[]
  constructors: ConstructorProps[]
  isSprint: boolean
  disabledFields: Set<keyof Schema>
  defaultValues: Schema
  isFormDisabled: boolean
  race: Pick<Database.Race, 'id' | 'raceName'>
  userGroups: UserGroup[]
}) {
  const hasMoreThanOneGroup = useMemo(() => userGroups.length > 1, [userGroups])

  const form = useForm<Schema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      groupTarget:
        defaultValues.groupTarget ?? (hasMoreThanOneGroup ? 'all' : 'this'),
    },
  })

  const fields = getFormFields(isSprint)
  const [isPending, startTransition] = useTransition()

  const [isShouldShowSaved, setShouldShowSaved] = useState(false)

  const {
    formState: { isDirty, isSubmitSuccessful },
    reset,
  } = form

  const isEditMode = Boolean(Object.values(defaultValues).length)

  useEffect(() => {
    posthog.capture(AnalyticsEvent.TIPS_FORM_VIEWED, {
      race_id: race.id,
      race_name: race.raceName,
      is_sprint: isSprint,
      mode: isEditMode ? 'edit' : 'create',
      closed_fields: disabledFields.size,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    resetFormStateToSetDirtyToFalse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitSuccessful])

  useEffect(() => {
    // on change, remove "Saved" text
    if (isDirty) {
      setShouldShowSaved(false)
    }
  }, [isDirty])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => runSubmit(data))}>
        <div className='space-y-8'>
          {fields.map((formField) => (
            <FormField
              key={formField.name}
              control={form.control}
              name={formField.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{formField.label}</FormLabel>
                  {formField.type === 'driver' ? (
                    <SelectDriver
                      drivers={drivers}
                      value={field.value}
                      onSelect={(driver) =>
                        form.setValue(formField.name, driver, {
                          shouldDirty: true,
                        })
                      }
                      disabled={disabledFields.has(formField.name)}
                    />
                  ) : (
                    <SelectConstructor
                      constructors={constructors}
                      value={field.value}
                      disabled={disabledFields.has(formField.name)}
                      onSelect={(constructor) =>
                        form.setValue(formField.name, constructor, {
                          shouldDirty: true,
                        })
                      }
                    />
                  )}
                  <FormDescription>{formField.description}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className='mt-10 w-full grid sm:grid-cols-12 gap-4'>
          {hasMoreThanOneGroup && (
            <div className='col-span-4 row-start-1'>
              <SelectGroupTargetField />
            </div>
          )}
          <Button
            className={cn(
              hasMoreThanOneGroup
                ? 'row-start-2 col-span-8 sm:row-start-1'
                : 'col-span-full',
            )}
            type='submit'
            disabled={isFormDisabled || isPending}
          >
            {isPending && <Spinner />}
            {isShouldShowSaved && !isPending && <LucideCheck />}
            {isPending ? 'Saving…' : isShouldShowSaved ? 'Saved' : 'Submit'}
          </Button>
        </div>
      </form>
    </Form>
  )

  function resetFormStateToSetDirtyToFalse() {
    // HACK: reset the form state after submit to set dirty to false
    reset(undefined, {
      keepValues: true,
      keepDirty: false,
      keepDefaultValues: false,
    })
  }

  function runSubmit(data: Schema) {
    startTransition(async () => {
      try {
        await saveTips(userGroups, data, race.raceName)
        const filledFieldsCount = Object.values(data).filter((v) => v).length
        posthog.capture(
          isEditMode
            ? AnalyticsEvent.TIPS_EDITED
            : AnalyticsEvent.TIPS_SUBMITTED,
          {
            race_id: race.id,
            race_name: race.raceName,
            is_sprint: isSprint,
            fields_filled: filledFieldsCount,
            group_target: data.groupTarget,
          },
        )

        setShouldShowSaved(true)
      } catch (err) {
        const error = err as Error
        Sentry.captureException(error, {
          tags: {
            operation: 'tip-form-submit',
            context: 'client-component',
          },
        })
        toast.error('Could not save', {
          description: error.message,
        })
      }
    })
  }

  function SelectGroupTargetField() {
    return (
      <FormField
        control={form.control}
        name='groupTarget'
        render={({ field, fieldState }) => (
          <FormItem>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              aria-invalid={fieldState.invalid}
            >
              <div className='flex items-center gap-3'>
                <RadioGroupItem value='all' id='all' />
                <Label htmlFor='all'>
                  <span>
                    Save to <span className='font-semibold'>all</span> groups
                  </span>
                </Label>
              </div>
              <div className='flex items-center gap-3'>
                <RadioGroupItem value='this' id='this' />
                <Label htmlFor='this'>
                  <span>
                    Save to <span className='font-semibold'>this</span> group
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </FormItem>
        )}
      />
    )
  }
}

async function saveTipsToAllUserGroups(groups: UserGroup[], data: Schema) {
  await Promise.all(
    groups.map(async (group) => {
      const updatedData: Schema = {
        ...data,
        groupId: group.id,
      }
      const result = await submitChanges(updatedData)
      if (!result.ok) {
        toast.error(`${group.name}: Error saving`, {
          description: result.message,
          duration: 2_000,
        })
        return null
      }
      toast.success(`${group.name}: Tips saved`, {
        description: 'Good Luck!',
      })
      return null
    }),
  )
}

async function saveTips(
  userGroups: UserGroup[],
  data: Schema,
  raceName: string,
) {
  if (data.groupTarget === 'all') {
    await saveTipsToAllUserGroups(userGroups, data)
    return
  }
  // save for this group
  const result = await submitChanges(data)
  if (!result.ok) {
    toast.error('Tips not saved', {
      description: result.message,
      duration: 2_000,
    })
    return
  }
  toast.success('Tips saved', {
    description: `Your tips for the ${raceName} have been saved. Good luck!`,
    duration: 2_000,
  })
}
