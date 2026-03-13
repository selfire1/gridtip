'use client'

import * as React from 'react'

import DriverOption, { DriverOptionProps } from '@/components/driver-option'
import { ResponsiveSelect } from './responsive-select'

export function SelectDriver({
  drivers,
  value,
  onSelect,
  disabled,
}: {
  drivers: DriverOptionProps[]
  value: { id: string } | undefined
  onSelect: (driver: DriverOptionProps | undefined) => void
  disabled?: boolean
}) {
  return (
    <ResponsiveSelect
      items={drivers}
      value={value}
      onSelect={onSelect}
      disabled={disabled}
      selectLabel='Select driver'
      searchLabel='Search drivers…'
      renderSelected={(driver) => (
        <DriverOption driver={driver} isSelected={false} />
      )}
      renderItem={(driver, isSelected) => (
        <DriverOption driver={driver} isSelected={isSelected} />
      )}
    />
  )
}
