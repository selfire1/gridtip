import { Combobox } from '@/components/combobox'
import UserAvatar from '@/components/user-avatar'
import { Database } from '@/db/types'
import { PredictionMember } from '../types/prediction-member'

export function SelectUser({
  users,
  value,
  onSelect,
  disabled = false,
}: {
  users: PredictionMember[]
  value: Database.UserId
  onSelect: (value: Database.UserId | undefined) => void
  disabled?: boolean
}) {
  return (
    <Combobox
      items={users}
      value={value}
      onSelect={onSelect}
      getSearchValue={(user) => user.name}
      placeholder='Search users…'
      emptyText='Select a user'
      disabled={disabled}
      renderItem={(user) => (
        <div className='flex items-center gap-2'>
          <UserAvatar
            name={user.name}
            profileImageUrl={user.imageSrc}
            className='size-6'
          />
          <p>{user.name}</p>
        </div>
      )}
    />
  )
}
