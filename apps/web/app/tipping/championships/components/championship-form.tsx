'use client'

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
import { ConstructorProps } from '@/components/constructor'
import { Button } from '@/components/ui/button'
import { useEffect, useTransition } from 'react'
import { Loader2Icon } from 'lucide-react'
import {
  ChampionshipsTipData,
  ChampionshipsTipSchema as formSchema,
} from '../actions/schema'
import { DeepPartial } from '@/types'
import { SelectConstructor } from '@/components/select-constructor'
import { DriverOptionProps as DriverOption } from '@/components/driver-option'
import { SelectDriver } from '@/components/select-driver'
import posthog from 'posthog-js'
import { AnalyticsEvent } from '@/lib/posthog/events'
import { submitChampionship } from '../actions/submit-championships'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'

export default function ChampionshipForm({
  drivers,
  constructors,
  defaultValues,
  disabled,
}: {
  defaultValues: DeepPartial<ChampionshipsTipData>
  drivers: DriverOption[]
  constructors: ConstructorProps[]
  disabled: boolean
}) {
  const form = useForm<ChampionshipsTipData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const fields = [
    {
      name: 'constructorChampion',
      label: 'Constructors’ Championship',
      hint: '10 points',
      description:
        'Which team will score the most points to take home the Championship this season?',
      type: 'constructor',
    },
    {
      name: 'driverChampion',
      label: 'Drivers’ Championship',
      hint: '15 points',
      description: 'Which driver will claim champion of the world this year?',
      type: 'driver',
    },
  ] as const

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    posthog.capture(AnalyticsEvent.CHAMPIONSHIP_TIPS_VIEWED, {
      has_existing_tips: Boolean(
        defaultValues.driverChampion || defaultValues.constructorChampion,
      ),
    })
  }, [defaultValues])

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
                  <div className='flex items-center justify-between'>
                    <FormLabel>{formField.label}</FormLabel>
                    {formField.hint && (
                      <p className='text-sm text-muted-foreground'>
                        {formField.hint}
                      </p>
                    )}
                  </div>
                  {formField.type === 'driver' ? (
                    <SelectDriver
                      drivers={drivers}
                      value={field.value}
                      onSelect={(driver) => {
                        if (!driver) return
                        form.setValue(formField.name, driver, {
                          shouldDirty: true,
                        })
                      }}
                      disabled={disabled}
                    />
                  ) : (
                    <SelectConstructor
                      constructors={constructors}
                      value={field.value}
                      disabled={disabled}
                      onSelect={(constructor) => {
                        if (!constructor) return
                        form.setValue(formField.name, constructor, {
                          shouldDirty: true,
                        })
                      }}
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
          disabled={disabled || isPending}
        >
          {isPending && <Loader2Icon className='animate-spin' />}
          Submit
        </Button>
      </form>
    </Form>
  )

  function runSubmit(data: ChampionshipsTipData) {
    startTransition(async () => {
      try {
        const result = await submitChampionship(data)
        if (!result.ok) {
          throw new Error(result.message)
        }
        posthog.capture(AnalyticsEvent.CHAMPIONSHIP_TIPS_SUBMITTED, {
          driver_selected: Boolean(data.driverChampion),
          constructor_selected: Boolean(data.constructorChampion),
        })
        toast.success('Tips saved', {
          description: `Your tips for the Championships have been saved. Good luck!`,
        })
      } catch (err) {
        const error = err as Error
        Sentry.captureException(error, {
          tags: {
            operation: 'championship-form-submit',
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
