'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DriverOption, SelectDriver } from '../../components/select-driver'
import { ConstructorProps } from '@/components/constructor'
import { SelectConstructor } from '../../components/select-constructor'
import { Button } from '@/components/ui/button'
import { useEffect, useTransition } from 'react'
import { Loader2Icon } from 'lucide-react'
import Pre from '@/components/debug'
import { schema as formSchema } from '../actions/schema'
import { DeepPartial } from '@/types'

export type Schema = z.infer<typeof formSchema>

export default function ChampionshipForm({
  drivers,
  constructors,
  defaultValues,
  disabled,
}: {
  defaultValues: DeepPartial<Schema>
  drivers: DriverOption[]
  constructors: ConstructorProps[]
  disabled: boolean
}) {
  const form = useForm<Schema>({
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

  async function runSubmit(data: Schema) {
    Promise.resolve()
    // TODO: implement
    console.log(data)
    // startTransition(async () => {
    //   try {
    //     await submitChanges(data)
    //     toast.success('Tips saved', {
    //       description: `Your tips for the ${race.raceName} have been saved. Good luck!`,
    //       duration: 2_000,
    //     })
    //     setShouldShowSaved(true)
    //   } catch (err) {
    //     const error = err as Error
    //     toast.error('Could not save', {
    //       description: error.message,
    //     })
    //   }
    // })
  }
}
