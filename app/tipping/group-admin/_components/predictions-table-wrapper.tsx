'use client'

import { useState, useMemo } from 'react'
import { DataTable } from './data-table'
import { columns } from './columns'
import { Filters } from './filters'
import { PredictionRow } from '../_utils/rows'
import { Database } from '@/db/types'

interface PredictionsTableWrapperProps {
  rows: PredictionRow[]
  races: Array<
    Pick<Database.Race, 'id' | 'locality' | 'country' | 'grandPrixDate'>
  >
  users: Array<{ id: string; name: string }>
}

export function PredictionsTableWrapper({
  rows,
  races,
  users,
}: PredictionsTableWrapperProps) {
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesRace = selectedRaceId ? row.race.id === selectedRaceId : true
      const matchesUser = selectedUserId ? row.user.id === selectedUserId : true
      return matchesRace && matchesUser
    })
  }, [rows, selectedRaceId, selectedUserId])

  return (
    <div className='space-y-4'>
      <Filters
        races={races}
        users={users}
        selectedRaceId={selectedRaceId}
        selectedUserId={selectedUserId}
        onRaceChange={setSelectedRaceId}
        onUserChange={setSelectedUserId}
      />
      <DataTable columns={columns} data={filteredRows} />
    </div>
  )
}
