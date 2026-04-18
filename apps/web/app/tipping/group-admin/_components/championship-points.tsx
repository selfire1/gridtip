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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { Database } from '@/db/types'
import z from 'zod'
import { Field } from '@/components/ui/field'
import { updateChampionshipPoints } from '../_actions/update-championship-points'
import { ChampionshipPointsSchema } from '../_actions/championship-schema'

export function ChampionshipPoints({
  group: {
    id: groupId,
    driversChampionshipPoints: initialDriverPoints,
    constructorsChampionshipPoints: initialConstructorsPoints,
  },
}: {
  group: Pick<
    Database.Group,
    'id' | 'driversChampionshipPoints' | 'constructorsChampionshipPoints'
  >
}) {
  const [driversPoints, setDriversPoints] = useState(
    initialDriverPoints?.toString(),
  )
  const [constructorPoints, setConstructorPoints] = useState(
    initialConstructorsPoints?.toString(),
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    startTransition(async () => {
      const validation = ChampionshipPointsSchema.safeParse({
        driversPoints,
        constructorPoints,
      })

      if (!validation.success) {
        toast.error('Invalid values', {
          description: z.prettifyError(validation.error),
        })
        return
      }

      const response = await updateChampionshipPoints(groupId, validation.data)

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
        <CardTitle>Championships Points</CardTitle>
        <CardDescription>
          Update the points that people score for correct championship
          predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <Field>
            <Label htmlFor='constructors'>Constructors’ championship</Label>
            <Input
              id='constructors'
              type='number'
              value={constructorPoints}
              onChange={(e) => setConstructorPoints(e.target.value)}
              className='max-w-md'
            />
          </Field>
          <Field>
            <Label htmlFor='drivers'>Drivers’ championship</Label>
            <Input
              id='drivers'
              type='number'
              value={driversPoints}
              onChange={(e) => setDriversPoints(e.target.value)}
              className='max-w-md'
            />
          </Field>
          <Button type='submit' disabled={isPending}>
            {isPending ? <Spinner /> : null}
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
