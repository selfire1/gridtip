import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Icon } from './icon'
import { Button } from './ui/button'
import Link from 'next/link'

export default function EmptyGroup({
  title = 'No group',
  description = 'You are not yet part of a group. Join a group to start tipping.',
}: {
  title?: string
  description?: string
}) {
  return (
    <Empty className='border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Icon.Group />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      <EmptyContent>
        <Button size='sm' variant='outline' asChild>
          <Link href='/tipping/groups'>View groups</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
