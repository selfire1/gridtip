'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Database } from '@/db/types'

interface FiltersProps {
  races: Array<Pick<Database.Race, 'id' | 'locality' | 'grandPrixDate'>>
  users: Array<{ id: string; name: string }>
  selectedRaceId: string | null
  selectedUserId: string | null
  onRaceChange: (raceId: string | null) => void
  onUserChange: (userId: string | null) => void
}

export function Filters({
  races,
  users,
  selectedRaceId,
  selectedUserId,
  onRaceChange,
  onUserChange,
}: FiltersProps) {
  // Sort races by date (most recent first)
  const sortedRaces = [...races].sort(
    (a, b) =>
      new Date(b.grandPrixDate).getTime() -
      new Date(a.grandPrixDate).getTime(),
  )

  // Sort users alphabetically
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className='flex gap-4 flex-wrap'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='race-filter' className='text-sm font-medium'>
          Race
        </label>
        <Select
          value={selectedRaceId ?? 'all'}
          onValueChange={(value) =>
            onRaceChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger id='race-filter' className='w-[200px]'>
            <SelectValue placeholder='All races' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All races</SelectItem>
            {sortedRaces.map((race) => (
              <SelectItem key={race.id} value={race.id}>
                {race.locality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='user-filter' className='text-sm font-medium'>
          User
        </label>
        <Select
          value={selectedUserId ?? 'all'}
          onValueChange={(value) =>
            onUserChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger id='user-filter' className='w-[200px]'>
            <SelectValue placeholder='All users' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All users</SelectItem>
            {sortedUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
