import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Leaderboard } from '../page'
import UserAvatar from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideArrowDown, LucideArrowUp, LucideMinus } from 'lucide-react'
import { ClassValue } from 'clsx'

type Row = Leaderboard[number]
export function ResultsTable({ leaderboard }: { leaderboard: Leaderboard }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Place</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Delta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaderboard.map((row) => (
          <TableRow key={row.user.id}>
            <TableCell>
              <PlaceBadge place={row.place} className='min-w-10' />
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <UserAvatar {...row.user} className='h-8 w-8 rounded-lg' />
                <p className='text-muted-foreground'> {row.user.name}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary' className='tabular-nums'>
                  {row.points}
                </Badge>
                <PointsDelta delta={row.pointsDelta} />
              </div>
            </TableCell>
            <TableCell>
              <PositionDelta delta={row.delta} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  function PositionDelta({ delta }: { delta: Row['pointsDelta'] }) {
    if (delta === null) {
      return
    }

    const { string, className, icon: Icon } = getInfo(delta)
    return (
      <span
        className={cn(
          className,
          'border-transparent flex items-center gap-0.5 tabular-nums text-xs',
        )}
      >
        <Icon size={12} />
        {string}
      </span>
    )

    function getInfo(delta: number) {
      if (delta === 0) {
        return {
          string: undefined,
          className: 'text-muted-foreground/50',
          icon: LucideMinus,
        }
      }
      if (delta < 0) {
        return {
          string: delta,
          className: 'text-destructive',
          icon: LucideArrowDown,
        }
      }
      return {
        string: delta,
        className: 'text-green-600 dark:text-green-200',
        icon: LucideArrowUp,
      }
    }
  }

  function PointsDelta({ delta }: { delta: Row['pointsDelta'] }) {
    if (delta === null) {
      return
    }

    const { string, className } = getInfo(delta)
    return (
      <Badge
        variant='outline'
        className={cn(
          className,
          'border-transparent',
          'tabular-nums',
          'min-w-8',
        )}
      >
        {string}
      </Badge>
    )

    function getInfo(delta: number): { string: string; className: ClassValue } {
      if (delta === 0) {
        return {
          string: '0',
          className: 'text-muted-foreground/50',
          // icon: LucideMinus,
        }
      }
      if (delta < 0) {
        return {
          string: `-${delta}`,
          className: 'text-destructive',
          // icon: LucideArrowDown,
        }
      }
      return {
        string: `+${delta}`,
        className: 'text-green-600 dark:text-green-200',
        // icon: LucideArrowUp,
      }
    }
  }

  function PlaceBadge({
    place,
    className,
  }: {
    place: Row['place']
    className?: string
  }) {
    const placeString = place + '.'
    switch (place) {
      case 1:
        return (
          <Badge variant='outline' className={cn(className, 'text-2xl shadow')}>
            🥇
          </Badge>
        )
      case 2:
        return (
          <Badge
            className={cn(className, 'text-base shadow-xs')}
            variant='outline'
          >
            🥈
          </Badge>
        )
      case 3:
        return (
          <Badge
            className={cn(className, 'text-sm shadow-2xs')}
            variant='outline'
          >
            🥉
          </Badge>
        )

      default:
        return (
          <Badge className={cn(className, 'text-xs')} variant='outline'>
            {placeString}
          </Badge>
        )
    }
  }
}
