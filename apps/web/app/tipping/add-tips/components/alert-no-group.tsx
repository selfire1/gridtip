import Alert from '@/components/alert'
import IconGroup from '@/components/icon/group'

export default function AlertNoGroup() {
  return (
    <>
      <Alert
        variant='destructive'
        title='No group selected'
        icon={IconGroup}
        description='Please select a group to start tipping.'
      />
    </>
  )
}
