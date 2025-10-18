'use client'

import { cn } from '@/lib/utils'
import { IconFromName } from './icon-from-name'
import type { Schema } from '@/lib/schemas/create-group'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldErrors,
  FieldLabel,
  FieldSet,
} from './ui/field'
import { Input } from './ui/input'
import { SUPPORTED_ICON_NAMES } from '@/constants/icon-names'

type FieldConfig = {
  name: string
  value: string | number
  setValue: (value: any) => void
  description?: string
}

export type GroupFieldsProps = {
  name: FieldConfig
  icon: FieldConfig
  cutoff: FieldConfig
  errors?: Record<keyof Schema, FieldErrors>
}

export default function GroupFields({
  name,
  icon,
  cutoff,
  errors,
}: GroupFieldsProps) {
  return (
    <FieldSet>
      <Field data-invalid={errors?.name}>
        <FieldLabel htmlFor='name'>Name</FieldLabel>
        <Input
          id='name'
          autoComplete='off'
          value={name.value}
          onChange={(e) => name.setValue(e.target.value)}
        />
        <FieldDescription>{name.description}</FieldDescription>
        {errors?.name && <FieldError errors={errors.name} />}
      </Field>
      <Field data-invalid={errors?.cutoff}>
        <FieldLabel htmlFor='cutoff'>Tipping cutoff</FieldLabel>
        <FieldDescription>
          How many minutes before qualifying for the race starts should tipping
          be closed?
        </FieldDescription>
        <Input
          id='cutoff'
          type='number'
          value={cutoff.value}
          onChange={(e) => cutoff.setValue(e.target.value)}
        />
        <FieldDescription>{cutoff.description}</FieldDescription>
        {errors?.cutoff && <FieldError errors={errors.cutoff} />}
      </Field>
      <Field data-invalid={errors?.icon}>
        <FieldLabel>Icon</FieldLabel>
        <div
          className='flex flex-wrap gap-2 max-h-48 overflow-y-auto'
          style={{ ['--card-width' as string]: '3rem' }}
        >
          {SUPPORTED_ICON_NAMES.map((iconOption) => (
            <button
              type='button'
              onClick={(e) => {
                e.preventDefault()
                icon.setValue(iconOption)
              }}
              key={iconOption}
              className={cn(
                'p-2 border border-transparent hover:bg-secondary rounded-lg transition-all',
                iconOption === icon.value && 'bg-secondary',
              )}
            >
              <IconFromName
                iconName={iconOption}
                className={cn(
                  'p-0.5 transition-transform size-6',
                  iconOption === icon.value && 'scale-120',
                )}
              />
            </button>
          ))}
        </div>
        <FieldDescription>{icon.description}</FieldDescription>
      </Field>
    </FieldSet>
  )
}
