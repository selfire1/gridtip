'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SUPPORTED_ICON_NAMES } from '@/constants/icon-names'
import { IconFromName } from '@/components/icon-from-name'
import { cn } from '@/lib/utils'
import { Button } from '@ui/button'
import { LucideChevronRight } from 'lucide-react'
import React from 'react'
import { CreateGroupDetailsOnlySchema } from '@/lib/schemas/create-group'
import { useOnboarding } from '../_lib/onboarding-context'
import { toast } from 'sonner'

const formSchema = CreateGroupDetailsOnlySchema.omit({ cutoff: true })
type FormSchema = z.infer<typeof formSchema>

export default function CreateGroupForm() {
  const { updateState, goToScreen, state } = useOnboarding()
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: state.createGroupScreenData?.name ?? '',
      icon: state.createGroupScreenData?.icon ?? SUPPORTED_ICON_NAMES[0],
    },
  })

  return (
    <div className='space-y-6'>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) =>
          toast.error('Invalid form'),
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Your group</CardTitle>
            <CardDescription>
              You can change any of these details later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='name'>Group Name</FieldLabel>
                    <Input
                      {...field}
                      type='text'
                      id='name'
                      autoComplete='off'
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      The name of your group. This is visible to anyone with the
                      link.
                    </FieldDescription>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name='icon'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Icon</FieldLabel>
                    <div
                      className='flex flex-wrap gap-2 max-h-48 sm:max-h-60 overflow-y-auto'
                      style={{ ['--card-width' as string]: '3rem' }}
                    >
                      {SUPPORTED_ICON_NAMES.map((iconOption) => (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.preventDefault()
                            field.onChange(iconOption)
                          }}
                          key={iconOption}
                          className={cn(
                            'p-2 border border-transparent hover:bg-secondary rounded-lg transition-all',
                            iconOption === field.value && 'bg-secondary',
                          )}
                        >
                          <IconFromName
                            iconName={iconOption}
                            className={cn(
                              'p-0.5 transition-transform size-6',
                              iconOption === field.value && 'scale-120',
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <FieldDescription>
                      This icon identifies your group.
                    </FieldDescription>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>
          </CardContent>
          <CardFooter className='flex justify-end'>
            <Button type='submit' size='lg'>
              Continue
              <LucideChevronRight />
            </Button>
          </CardFooter>
        </Card>
      </form>
      <div className='flex justify-end'>
        <Button
          type='button'
          variant='ghost'
          onClick={() => {
            updateState({
              createGroupScreenData: undefined,
            })
            goToScreen('global-group')
          }}
          size='sm'
          className='text-xs'
        >
          Continue without creating a group
          <LucideChevronRight />
        </Button>
      </div>
    </div>
  )

  function onSubmit(data: FormSchema) {
    console.log('submit', data)
    updateState({
      createGroupScreenData: {
        ...data,
        cutoff: 0,
      },
    })
    goToScreen('global-group')
  }
}
