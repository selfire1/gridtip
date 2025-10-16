'use client'

import { cn } from '@/lib/utils'
import { IconFromName, IconName, SUPPORTED_ICON_NAMES } from './icon-from-name'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldErrors,
  FieldLabel,
  FieldSet,
} from './ui/field'
import { Input } from './ui/input'

export default function GroupFields({
  name,
  selectedIcon,
  setName,
  setIcon,
  errors,
}: {
  name: string
  selectedIcon: IconName
  setName: (name: string) => void
  setIcon: (icon: IconName) => void
  errors?: { name: FieldErrors; icon: FieldErrors }
}) {
  return (
    <FieldSet>
      <Field data-invalid={errors?.name}>
        <FieldLabel htmlFor='name'>Name</FieldLabel>
        <Input
          id='name'
          autoComplete='off'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FieldDescription>
          The name is visible to people you invite.
        </FieldDescription>
        {errors?.name && <FieldError errors={errors.name} />}
      </Field>
      <Field data-invalid={errors?.icon}>
        <FieldLabel>Icon</FieldLabel>
        <div
          className='flex flex-wrap gap-2 max-h-48 overflow-y-auto'
          style={{ ['--card-width' as string]: '3rem' }}
        >
          {SUPPORTED_ICON_NAMES.map((icon) => (
            <button
              type='button'
              onClick={(e) => {
                e.preventDefault()
                setIcon(icon)
              }}
              key={icon}
              className={cn(
                'p-2 border border-transparent hover:bg-secondary rounded-lg transition-all',
                icon === selectedIcon && 'bg-secondary',
              )}
            >
              <IconFromName
                iconName={icon}
                className={cn(
                  'p-0.5 transition-transform size-6',
                  icon === selectedIcon && 'scale-120',
                )}
              />
            </button>
          ))}
        </div>
        <FieldDescription>You can change the icon later.</FieldDescription>
      </Field>
    </FieldSet>
  )
}
