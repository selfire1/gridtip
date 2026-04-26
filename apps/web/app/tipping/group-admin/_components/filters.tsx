'use client'

import { Database } from '@/db/types'
import { Combobox } from '@/components/combobox'
import CountryFlag from '@/components/country-flag'
import UserAvatar from '@/components/user-avatar'

interface FiltersProps {
  races: Array<
    Pick<Database.Race, 'id' | 'locality' | 'country' | 'grandPrixDate'>
  >
  users: Array<{
    id: string
    name: string
    imageSrc: string | undefined | null
  }>
  selectedRaceId: string | null
  selectedUserId: string | null
  onRaceChange: (raceId: string | null | 'all') => void
  onUserChange: (userId: string | null | 'all') => void
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
    {
      id: 'all',
      locality: 'All races',
      country: '',
      grandPrixDate: new Date(),
    },
    ...sortedRaces,
  ]

  // Add "All" option to users
  const usersWithAll = [
    { id: 'all', name: 'All users', imageSrc: null },
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
          onSelect={(value) => {
            if (!value || value === 'all') {
              onRaceChange(null)
              return
            }
            onRaceChange(value)
          }}
          getSearchValue={(race) => race.locality}
          placeholder='Search races...'
          emptyText='All races'
          renderItem={(race) => (
            <div className='flex items-center gap-2'>
              {race.id !== 'all' && (
                <CountryFlag
                  country={race.country}
                  isEager={false}
                  className='size-6'
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
          onSelect={(value) => {
            if (!value || value === 'all') {
              onUserChange(null)
              return
            }
            onUserChange(value)
          }}
          getSearchValue={(user) => user.name}
          placeholder='Search users...'
          emptyText='All users'
          renderItem={(user) => (
            <div className='flex items-center gap-2'>
              {user.id !== 'all' && (
                <UserAvatar
                  name={user.name}
                  profileImageUrl={user.imageSrc}
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
