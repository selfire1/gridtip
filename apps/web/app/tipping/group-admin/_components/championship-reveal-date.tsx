'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateChampionshipRevealDate } from '@/actions/update-championship-reveal-date'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

interface ChampionshipRevealDateProps {
  groupId: string
  currentDate: Date | null
}

export function ChampionshipRevealDate({
  groupId,
  currentDate,
}: ChampionshipRevealDateProps) {
  const [date, setDate] = useState<string>(
    currentDate ? formatDateForInput(currentDate) : '',
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const revealDate = date ? new Date(date) : null

      const response = await updateChampionshipRevealDate(groupId, {
        championshipTipsRevalDate: revealDate,
      })

      if (!response.ok) {
        toast.error(response.message, {
          description: response.error,
        })
        return
      }

      toast.success(response.message)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Championship Tips Reveal Date</CardTitle>
        <CardDescription>
          Set when championship predictions become visible to all group members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='reveal-date'>Reveal Date</Label>
            <Input
              id='reveal-date'
              type='datetime-local'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className='max-w-md'
            />
            <p className='text-sm text-muted-foreground'>
              Championship tips will be visible to everyone after this date
            </p>
          </div>
          <Button type='submit' disabled={isPending}>
            {isPending ? <Spinner /> : null}
            Save Date
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function formatDateForInput(date: Date): string {
  // Format: YYYY-MM-DDThh:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
