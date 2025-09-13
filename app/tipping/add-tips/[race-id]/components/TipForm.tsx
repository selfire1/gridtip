'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  DriverOption,
  SelectDriver,
} from '@/app/tipping/components/select-driver'
import {
  ConstructorOption,
  SelectConstructor,
} from '@/app/tipping/components/select-constructor'
import { useActionState, useTransition } from 'react'
import { submitChanges } from '../actions/submit-tip'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/db/types'

const idObject = z
  .object({
    id: z.string().min(1, 'Required'),
  })
  .loose()

export const formSchema = z
  .object({
    pole: idObject,
    p1: idObject,
    p10: idObject,
    last: idObject,
    constructorWithMostPoints: idObject,
    sprintP1: idObject,
    groupId: z.string().optional(),
    raceId: z.string().optional(),
  })
  .partial()

export type Schema = z.infer<typeof formSchema>

export default function TipForm({
  drivers,
  constructors,
  isSprint,
  disabledFields,
  defaultValues,
  isFormDisabled,
  groupId,
  race,
}: {
  drivers: DriverOption[]
  constructors: ConstructorOption[]
  isSprint: boolean
  disabledFields: Set<keyof Schema>
  defaultValues: Schema
  isFormDisabled: boolean
  groupId: string
  race: Pick<Database.Race, 'id' | 'raceName'>
}) {
  const form = useForm<Schema>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const fields = getFormFields()
  form.setValue('groupId', groupId)
  form.setValue('raceId', race.id)

  const [isPending, startTransition] = useTransition()

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
                  <FormControl>
                    {formField.type === 'driver' ? (
                      <SelectDriver
                        drivers={drivers}
                        value={field.value}
                        form={form}
                        name={formField.name}
                        disabled={disabledFields.has(formField.name)}
                      />
                    ) : (
                      <SelectConstructor
                        constructors={constructors}
                        value={field.value}
                        form={form}
                        name={formField.name}
                        disabled={disabledFields.has(formField.name)}
                      />
                    )}
                  </FormControl>
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
          {isPending ? 'Saving…' : 'Submit'}
        </Button>
      </form>
    </Form>
  )

  function runSubmit(data: Schema) {
    startTransition(async () => {
      try {
        await submitChanges(data)
        toast.success('Tips saved', {
          description: `Your tips for the ${race.raceName} have been saved. Good luck!`,
        })
      } catch (err) {
        const error = err as Error
        toast.error('Could not save', {
          description: error.message,
        })
      }
    })
  }

  function getFormFields() {
    const allFields = [
      {
        name: 'sprintP1',
        description: 'Who will win the sprint race?',
        label: 'Sprint P1',
        type: 'driver',
      },
      {
        label: 'Pole Position',
        description: 'Which driver will start at the front?',
        name: 'pole',
        type: 'driver',
      },
      {
        label: 'P1',
        description: 'Who will finish first in the GP?',
        name: 'p1',
        type: 'driver',
      },
      {
        label: 'P10',
        description: 'Which driver will just snatch some points?',
        name: 'p10',
        type: 'driver',
      },
      {
        label: 'Last place',
        description: 'Which driver is last to finish? Excluding early DNFs.',
        name: 'last',
        type: 'driver',
      },
      {
        label: 'Most constructor points',
        description:
          'Which constructor will haul the most points in the Grand Prix?',
        name: 'constructorWithMostPoints',
        type: 'constructor',
      },
    ] as const
    return allFields.filter((field) =>
      field.name !== 'sprintP1' ? true : isSprint,
    )
  }

  function onSubmit(values: Schema) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }
}
