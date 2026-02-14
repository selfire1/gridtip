'use client'

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
import { useEffect, useState, useTransition } from 'react'
import { submitChanges } from '../actions/submit-tip'
import { Loader2Icon, LucideCheck } from 'lucide-react'
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

const formSchema = submitTipSchema.partial()
export type Schema = z.infer<typeof formSchema>

export default function TipForm({
  drivers,
  constructors,
  isSprint,
  disabledFields,
  defaultValues,
  isFormDisabled,
  race,
}: {
  drivers: DriverOption[]
  constructors: ConstructorProps[]
  isSprint: boolean
  disabledFields: Set<keyof Schema>
  defaultValues: Schema
  isFormDisabled: boolean
  race: Pick<Database.Race, 'id' | 'raceName'>
}) {
  const form = useForm<Schema>({
    resolver: zodResolver(formSchema),
    defaultValues,
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
        <Button
          className='mt-10 w-full'
          type='submit'
          disabled={isFormDisabled || isPending}
        >
          {isPending && <Loader2Icon className='animate-spin' />}
          {isShouldShowSaved && !isPending && <LucideCheck />}
          {isPending ? 'Saving…' : isShouldShowSaved ? 'Saved' : 'Submit'}
        </Button>
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
        await submitChanges(data)

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
          },
        )

        toast.success('Tips saved', {
          description: `Your tips for the ${race.raceName} have been saved. Good luck!`,
          duration: 2_000,
        })
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
}
