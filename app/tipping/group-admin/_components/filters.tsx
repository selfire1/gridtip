'use client'

import { Database } from '@/db/types'
import { Combobox } from '@/components/combobox'
import CountryFlag from '@/components/country-flag'
import UserAvatar from '@/components/user-avatar'

interface FiltersProps {
  races: Array<
    Pick<Database.Race, 'id' | 'locality' | 'country' | 'grandPrixDate'>
  >
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
      new Date(b.grandPrixDate).getTime() - new Date(a.grandPrixDate).getTime(),
  )

  // Sort users alphabetically
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name))

  // Add "All" option to races
  const racesWithAll = [
    { id: 'all', locality: 'All races', country: '', grandPrixDate: new Date() },
    ...sortedRaces,
  ]

  // Add "All" option to users
  const usersWithAll = [
    { id: 'all', name: 'All users' },
    ...sortedUsers,
  ]

  return (
    <div className='flex gap-4 flex-wrap'>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor='race-filter' className='text-sm font-medium'>
          Race
        </label>
        <Combobox
          items={racesWithAll}
          value={selectedRaceId ?? 'all'}
          onSelect={(value) => onRaceChange(value === 'all' ? null : value)}
          getSearchValue={(race) => race.locality}
          placeholder='Search races...'
          emptyText='All races'
          renderItem={(race) => (
            <div className='flex items-center gap-2'>
              {race.id !== 'all' && (
                <CountryFlag
                  country={race.country}
                  isEager={false}
                  className='size-5'
                />
              )}
              <span>{race.locality}</span>
            </div>
          )}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <label htmlFor='user-filter' className='text-sm font-medium'>
          User
        </label>
        <Combobox
          items={usersWithAll}
          value={selectedUserId ?? 'all'}
          onSelect={(value) => onUserChange(value === 'all' ? null : value)}
          getSearchValue={(user) => user.name}
          placeholder='Search users...'
          emptyText='All users'
          renderItem={(user) => (
            <div className='flex items-center gap-2'>
              {user.id !== 'all' && (
                <UserAvatar
                  id={user.id}
                  name={user.name}
                  className='size-5 rounded-full'
                />
              )}
              <span>{user.name}</span>
            </div>
          )}
        />
      </div>
    </div>
  )
}
