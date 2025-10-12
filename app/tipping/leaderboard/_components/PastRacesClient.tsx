'use client'

import React, { useEffect, useState } from 'react'
import {
  Constructors,
  RacePredictionMaps,
  RacesWithResults,
} from './PastRacesServer'
import { Button } from '@/components/ui/button'
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideChevronsUpDown,
  LucideIcon,
} from 'lucide-react'
import { Icon } from '@/components/icon'
import {
  TableBody,
  TableCell,
  TableHeader as ShadcnTableHeader,
  TableRow,
  Table,
  TableHead,
} from '@/components/ui/table'
import DriverOption, { DriverOptionProps } from '@/components/driver-option'
import UserAvatar from '@/components/user-avatar'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { Database } from '@/db/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import Constructor from '@/components/constructor'

export default function PastRacesClient({
  races,
  maps,
  constructors,
}: {
  races: RacesWithResults
  maps: RacePredictionMaps
  constructors: Constructors
}) {
  type Race = RacesWithResults[number]

  const [index, setIndex] = useState(0)
  const [race, setRace] = useState<Race>(races[0])

  useEffect(() => {
    setRace(races[index])
  }, [index, races])

  const isMobile = useIsMobile()

  const [maxUsers, setMaxUsers] = useState(4)

  useEffect(() => {
    if (isMobile) {
      setMaxUsers(2)
      return
    }
    setMaxUsers(4)
  }, [isMobile])

  const constructorsById = constructors.reduce((acc, constructor) => {
    acc.set(constructor.id, constructor)
    return acc
  }, new Map<string, Constructors[number]>())

  return (
    <div className='space-y-8'>
      <Header />

      <ResultsCard header='Grand Prix' icon={Icon.GrandPrix}>
        <GrandPrixResults />
      </ResultsCard>

      <ResultsCard header='Qualifying' icon={Icon.Qualifying}>
        <QualifyingResults />
      </ResultsCard>

      {!!maps.sprint.get(race.id)?.length && (
        <ResultsCard header='Sprint' icon={Icon.Sprint}>
          <SprintResults />
        </ResultsCard>
      )}

      <ResultsCard header='Constructor' icon={Icon.Constructor}>
        <ConstructorResults />
      </ResultsCard>

      <div className='flex items-center justify-between  my-4'>
        <PreviousButton />
        <p className='font-semibold tracking-tight'>{race.raceName}</p>
        <NextButton />
      </div>
    </div>
  )

  function ResultsCard({
    children,
    icon,
    header,
  }: {
    children: React.ReactNode
    icon: LucideIcon
    header: string
  }) {
    const Icon = icon
    return (
      <Card className='isolate'>
        <CardContent>
          <div className='sticky bg-card/80 backdrop-blur border-b -mx-6 px-6 z-10 py-2 -mt-2 top-0 mb-4'>
            <h4 className='font-medium tracking-tight flex items-center gap-1'>
              <Icon size={16} />
              {header}
            </h4>
          </div>
          {children}
        </CardContent>
      </Card>
    )
  }

  function GrandPrixResults() {
    return (
      <Table>
        <TableHeader titles={['Place', 'Driver', 'Predictions']} />
        <TableBody>
          {maps.grandPrix.get(race.id)?.map((row) => {
            return (
              <TableRow key={row.driver.id}>
                <PlaceAndDriver
                  place={row.place}
                  driver={row.driver}
                  didAnyonePredict={row.didAnyonePredict}
                />

                {/* Results */}
                <TableCell className='grid grid-cols-3'>
                  <div>
                    <UserResults
                      positionText='P1'
                      users={row.predictedP1By}
                      isCorrect={row.isP1Correct}
                    />
                  </div>
                  <div>
                    <UserResults
                      positionText='P10'
                      users={row.predictedP10By}
                      isCorrect={row.isP10Correct}
                    />
                  </div>
                  <div>
                    <UserResults
                      positionText='Last'
                      users={row.predictedLast}
                      isCorrect={row.isLastCorrect}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          }) || <p>No results</p>}
        </TableBody>
      </Table>
    )
  }

  function QualifyingResults() {
    return (
      <Table>
        <TableHeader titles={['Place', 'Driver', 'Prediction']} />
        <TableBody>
          {maps.qualifying.get(race.id)?.map((row) => {
            return (
              <TableRow key={row.driver.id}>
                <PlaceAndDriver place={row.place} driver={row.driver} />

                {/* Results */}
                <TableCell>
                  <div>
                    <UserResults
                      positionText='Pole'
                      users={row.predictedBy}
                      isCorrect={row.isCorrect}
                      maxUsersOverwrite={6}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          }) || <p>No results</p>}
        </TableBody>
      </Table>
    )
  }

  function ConstructorResults() {
    return (
      <Table>
        <TableHeader titles={['Points', 'Constructor', 'Predicted by']} />
        <TableBody>
          {maps.constructors.get(race.id)?.map((row) => {
            return (
              <TableRow key={row.constructorId}>
                <TableCell className='w-12 text-muted-foreground text-xs text-right'>
                  {row.points}
                </TableCell>
                <TableCell className='text-muted-foreground w-48'>
                  <Constructor
                    constructor={constructorsById.get(row.constructorId)!}
                  />
                </TableCell>

                {/* Results */}
                <TableCell>
                  <div>
                    <UserResults
                      users={row.users}
                      isCorrect={row.isCorrect}
                      maxUsersOverwrite={8}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          }) || <p>No results</p>}
        </TableBody>
      </Table>
    )
  }

  function SprintResults() {
    return (
      <Table>
        <TableHeader titles={['Place', 'Driver', 'Prediction']} />
        <TableBody>
          {maps.sprint.get(race.id)?.map((row) => {
            return (
              <TableRow key={row.driver.id}>
                <PlaceAndDriver place={row.place} driver={row.driver} />

                <TableCell>
                  <div>
                    <UserResults
                      positionText='Pole'
                      users={row.predictedP1By}
                      isCorrect={row.isP1Correct}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          }) || <p>No results</p>}
        </TableBody>
      </Table>
    )
  }

  function PlaceAndDriver({
    place,
    driver,
    didAnyonePredict = true,
  }: {
    place: number
    driver: DriverOptionProps
    didAnyonePredict?: boolean
  }) {
    return (
      <>
        {/* Place */}
        <TableCell className='w-12 text-muted-foreground text-xs text-right'>
          {place}.
        </TableCell>

        {/* Driver */}
        <TableCell
          className={cn(
            'w-32 text-muted-foreground',
            !didAnyonePredict && 'opacity-50',
          )}
        >
          <DriverOption driver={driver} short />
        </TableCell>
      </>
    )
  }

  function TableHeader({ titles }: { titles: string[] }) {
    return (
      <ShadcnTableHeader>
        <TableRow>
          {titles.map((title) => (
            <TableHead key={title}>{title}</TableHead>
          ))}
        </TableRow>
      </ShadcnTableHeader>
    )
  }

  function UserResults({
    users,
    positionText,
    isCorrect,
    maxUsersOverwrite,
  }: {
    users?: Pick<Database.User, 'id' | 'name' | 'image'>[]
    positionText?: string
    isCorrect: boolean
    maxUsersOverwrite?: number
  }) {
    if (!users?.length) {
      return
    }
    const localMaxUsers = maxUsersOverwrite ?? maxUsers
    return (
      <Collapsible>
        <CollapsibleTrigger className='flex items-center'>
          <TriggerRow users={users} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Content users={users} />
        </CollapsibleContent>
      </Collapsible>
    )

    function Content(props: { users: NonNullable<typeof users> }) {
      return (
        <>
          <Separator className='my-3' />
          <div>
            <p className='text-xs font-medium tracking-tight'>
              {positionText ? `Tipped ${positionText} by` : 'Tipped by'}
            </p>
            <ul className='py-2'>
              {props.users.map((user) => {
                return (
                  <li
                    className='py-2 first:pt-0 last:pb-0 border-b last:border-b-0 flex items-center gap-1'
                    key={user.id}
                  >
                    <UserAvatar
                      key={user.id}
                      {...user}
                      className='hidden sm:block size-6 lg:size-8 rounded-lg'
                    />
                    <span className='text-xs lg:text-sm text-muted-foreground'>
                      {user.name}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )
    }

    function TriggerRow(props: { users: NonNullable<typeof users> }) {
      return (
        <span className='flex items-center gap-1'>
          {positionText && (
            <Badge
              className={cn(
                isCorrect
                  ? 'bg-green-600 dark:bg-green-100'
                  : 'text-muted-foreground',
              )}
              variant={isCorrect ? 'default' : 'outline'}
            >
              {positionText}
            </Badge>
          )}
          <div
            className={cn(
              '*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2',
              !isCorrect && '*:data-[slot=avatar]:grayscale',
            )}
          >
            {users?.slice(0, localMaxUsers).map((user) => {
              return (
                <UserAvatar
                  key={user.id}
                  {...user}
                  className='size-6 lg:size-8 rounded-full'
                />
              )
            })}
            {props.users.length > localMaxUsers && (
              <div className='size-6 lg:size-8 rounded-full bg-muted relative z-10 grid place-items-center text-xs font-medium ring-border text-muted-foreground tracking-tight ring-2'>
                +{props.users.length - localMaxUsers}
              </div>
            )}
          </div>
          {props.users.length > localMaxUsers && (
            <LucideChevronsUpDown
              className='shrink-0 text-muted-foreground'
              size={14}
            />
          )}
        </span>
      )
    }
  }

  function PreviousButton() {
    return (
      <Button
        onClick={goPrevious}
        disabled={isPreviousDisabled()}
        size='sm'
        variant='ghost'
      >
        <LucideArrowLeft />
        Previous
      </Button>
    )

    function goPrevious() {
      setIndex(index + 1)
    }

    function isPreviousDisabled() {
      return index === races.length - 1
    }
  }

  function NextButton() {
    return (
      <Button
        onClick={goNext}
        disabled={isNextDisabled()}
        size='sm'
        variant='ghost'
      >
        Next
        <LucideArrowRight />
      </Button>
    )

    function goNext() {
      setIndex(index - 1)
    }

    function isNextDisabled() {
      return index === 0
    }
  }

  function Header() {
    return (
      <div className='flex items-center justify-between bg-gradient-to-b from-muted to-transparent px-4 -mx-4 my-4'>
        <PreviousButton />
        <div className='lg:text-lg xl:text-xl py-4 font-semibold tracking-tight flex items-baseline gap-2'>
          <h3>{race.raceName}</h3>
          <p className='hidden sm:block text-muted-foreground font-medium'>
            Round {race.round}
          </p>
        </div>
        <NextButton />
      </div>
    )
  }
}
