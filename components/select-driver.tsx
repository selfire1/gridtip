'use client'

import * as React from 'react'

import DriverOption, { DriverOptionProps } from '@/components/driver-option'
import { ResponsiveSelect } from './responsive-select'
import { getDriverName } from '@/lib/driver'

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
      filter={(id, query) => {
        const driver = drivers.find((d) => d.id === id)
        const name = driver ? getDriverName(driver) : ''
        const isMatch = name.toLowerCase().includes(query.toLowerCase())
        if (!isMatch) {
          return 0
        }
        return 1
      }}
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
