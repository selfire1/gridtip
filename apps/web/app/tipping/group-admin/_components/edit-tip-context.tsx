'use client'
import * as React from 'react'
import { TipFormData } from './create-edit-tip-dialog'

const GroupAdminContext = React.createContext<TipFormData | null>(null)
export function useTipFormContext() {
  const context = React.useContext(GroupAdminContext)
  if (!context) {
    throw new Error('useTipFormContext must be used within a TipFormProvider')
  }
  return context
}

export default function TipFormProvider({
  context,
  children,
}: {
  context: TipFormData
  children: React.ReactNode
}) {
  return (
    <GroupAdminContext.Provider value={context}>
      {children}
    </GroupAdminContext.Provider>
  )
}
