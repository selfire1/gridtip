import { ChevronsUpDown } from 'lucide-react'
import { Button, ShadButtonProps } from './ui/button'
import { FormControl } from './ui/form'

export function TriggerButton<TItem>({
  selectedItem: selected,
  renderSelected,
  emptyLabel,
  disabled,
  ...props
}: {
  selectedItem: TItem | undefined
  renderSelected(item: TItem): React.ReactNode
  emptyLabel: string
  disabled?: boolean
} & ShadButtonProps) {
  return (
    <FormControl>
      <Button
        type='button'
        variant='outline'
        className='justify-between flex'
        disabled={disabled}
        {...props}
      >
        {selected ? renderSelected(selected) : <EmptyState />}
        <ChevronsUpDown className='opacity-50' />
      </Button>
    </FormControl>
  )
  function EmptyState() {
    return <span>{emptyLabel}</span>
  }
}
