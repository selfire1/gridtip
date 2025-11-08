import { Combobox } from '@/components/combobox'
import { FormField } from '@/components/ui/form'
import UserAvatar from '@/components/user-avatar'
import { Database } from '@/db/types'

export function SelectUser({
  users,
  value,
  onSelect,
  disabled = false,
}: {
  users: Pick<Database.User, 'id' | 'name'>[]
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
          <UserAvatar name={user.name} id={user.id} className='size-6' />
          <p>{user.name}</p>
        </div>
      )}
    />
  )
}
