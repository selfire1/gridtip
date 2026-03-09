import { Combobox } from '@/components/combobox'
import UserAvatar from '@/components/user-avatar'
import { Database } from '@/db/types'
import { PredictionMember } from '../types/prediction-member'

export function SelectUser({
  members,
  value,
  onSelect,
  disabled = false,
}: {
  members: PredictionMember[]
  value: Database.UserId
  onSelect: (value: Database.UserId | undefined) => void
  disabled?: boolean
}) {
  return (
    <Combobox
      items={members}
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
