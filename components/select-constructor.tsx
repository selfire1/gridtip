'use client'

import * as React from 'react'

import ConstructorOption, {
  type ConstructorProps,
} from '@/components/constructor'
import { ResponsiveSelect } from './responsive-select'

export function SelectConstructor({
  constructors,
  value,
  onSelect,
  disabled,
}: {
  constructors: ConstructorProps[]
  value: { id: string } | undefined
  onSelect: (driver: ConstructorProps | undefined) => void
  disabled?: boolean
}) {
  return (
    <ResponsiveSelect
      items={constructors}
      value={value}
      onSelect={onSelect}
      disabled={disabled}
      selectLabel='Select constructor'
      searchLabel='Search constructors…'
      renderSelected={(constructor) => (
        <ConstructorOption constructor={constructor} isSelected={false} />
      )}
      renderItem={(constructor, isSelected) => (
        <ConstructorOption constructor={constructor} isSelected={isSelected} />
      )}
    />
  )
}
