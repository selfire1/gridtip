import {
  getConstructorOptions,
  getCurrentGroup,
  getCurrentGroupId,
  getDriverOptions,
  getGroupMembers,
} from '@/lib/utils/groups'
import ChampionshipForm, { Schema } from './components/championship-form'
import { verifySession } from '@/lib/dal'
import { db } from '@/db'
import { DeepPartial } from '@/types'
import { isPast } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import UserAvatar from '@/components/user-avatar'
import Constructor from '@/components/constructor'
import { cn } from '@/lib/utils'
import { getConstructorCssVariable } from '@/lib/utils/index'
import React from 'react'

export default async function ChampionshipPage() {
  const { userId } = await verifySession()
  const groupId = await getCurrentGroupId()

  const drivers = await getDriverOptions()
  const constructors = await getConstructorOptions()

  const defaults = await getDefaultValues()

  const isAfterDeadline = true

  const group = groupId ? await getCurrentGroup(userId) : null
  const showEveryonesTips =
    group?.championshipTipsRevalDate &&
    isPast(group.championshipTipsRevalDate)

  const everyonesTips = showEveryonesTips
    ? await getEveryonesTips(groupId!)
    : null

  return (
    <div className='space-y-8'>
      <div className='space-y-2'>
        <h1 className='page-title'>
          {isAfterDeadline ? 'Your Championship Tips' : 'Tip Championships'}
        </h1>
        <p className='text-muted-foreground'>
          {isAfterDeadline
            ? 'Score extra points by guessing the Constructors' and Drivers' Championships.'
            : 'Guess the Constructors' and Drivers' Championships to secure extra points.'}
        </p>
      </div>
      <ChampionshipForm
        defaultValues={defaults}
        drivers={drivers}
        constructors={constructors}
        disabled={isAfterDeadline}
      />
      {showEveryonesTips && everyonesTips && (
        <EveryonesChampionshipTips
          tips={everyonesTips}
          currentUserId={userId}
        />
      )}
    </div>
  )

  async function getDefaultValues(): Promise<DeepPartial<Schema>> {
    const tips = await getDefaultValuesArray()
    const driverTip = tips.find((tip) => tip.position === 'championshipDriver')
    const constructorTip = tips.find(
      (tip) => tip.position === 'championshipConstructor',
    )
    return {
      driverChampion: {
        id: driverTip?.driver?.id,
      },
      constructorChampion: {
        id: constructorTip?.constructor?.id,
      },
    }
  }

  async function getDefaultValuesArray() {
    if (!groupId) {
      return []
    }
    const tip = await db.query.predictionsTable.findFirst({
      where: (prediction, { eq, and }) =>
        and(
          eq(prediction.groupId, groupId),
          eq(prediction.userId, userId),
          eq(prediction.isForChampionship, true),
        ),
    })
    if (!tip?.id) return []
    return await db.query.predictionEntriesTable.findMany({
      where: (entry, { eq }) => eq(entry.predictionId, tip.id),
      columns: {
        position: true,
      },
      with: {
        constructor: {
          columns: {
            id: true,
            name: true,
          },
        },
        driver: {
          columns: {
            id: true,
            givenName: true,
            familyName: true,
          },
        },
      },
    })
  }

  async function getEveryonesTips(groupId: string) {
    const predictions = await db.query.predictionsTable.findMany({
      where: (prediction, { eq, and }) =>
        and(
          eq(prediction.groupId, groupId),
          eq(prediction.isForChampionship, true),
        ),
      columns: {
        id: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    })

    const predictionIds = predictions.map((p) => p.id)
    if (predictionIds.length === 0) return []

    const entries = await db.query.predictionEntriesTable.findMany({
      where: (entry, { inArray }) => inArray(entry.predictionId, predictionIds),
      columns: {
        id: true,
        predictionId: true,
        position: true,
      },
      with: {
        constructor: {
          columns: {
            id: true,
            name: true,
          },
        },
        driver: {
          columns: {
            id: true,
            givenName: true,
            familyName: true,
            permanentNumber: true,
            constructorId: true,
          },
        },
      },
    })

    return predictions.map((prediction) => {
      const userEntries = entries.filter(
        (e) => e.predictionId === prediction.id,
      )
      const driverEntry = userEntries.find(
        (e) => e.position === 'championshipDriver',
      )
      const constructorEntry = userEntries.find(
        (e) => e.position === 'championshipConstructor',
      )

      return {
        user: prediction.user,
        driver: driverEntry?.driver,
        constructor: constructorEntry?.constructor,
      }
    })
  }
}

type ChampionshipTip = {
  user: { id: string; name: string }
  driver:
    | {
        id: string
        givenName: string
        familyName: string
        permanentNumber: string
        constructorId: string
      }
    | null
    | undefined
  constructor:
    | {
        id: string
        name: string
      }
    | null
    | undefined
}

function EveryonesChampionshipTips({
  tips,
  currentUserId,
}: {
  tips: ChampionshipTip[]
  currentUserId: string
}) {
  const driverTips = tips
    .filter((t) => t.driver)
    .reduce(
      (acc, tip) => {
        const existing = acc.find((item) => item.driver.id === tip.driver!.id)
        if (existing) {
          existing.users.push(tip.user)
        } else {
          acc.push({ driver: tip.driver!, users: [tip.user] })
        }
        return acc
      },
      [] as Array<{
        driver: NonNullable<(typeof tips)[number]['driver']>
        users: (typeof tips)[number]['user'][]
      }>,
    )

  const constructorTips = tips
    .filter((t) => t.constructor)
    .reduce(
      (acc, tip) => {
        const existing = acc.find(
          (item) => item.constructor.id === tip.constructor!.id,
        )
        if (existing) {
          existing.users.push(tip.user)
        } else {
          acc.push({ constructor: tip.constructor!, users: [tip.user] })
        }
        return acc
      },
      [] as Array<{
        constructor: NonNullable<(typeof tips)[number]['constructor']>
        users: (typeof tips)[number]['user'][]
      }>,
    )

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='title-2 mb-4'>Everyone's Championship Tips</h2>
        <div className='grid md:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Driver Championship</CardTitle>
              <CardDescription>
                Who everyone thinks will win the drivers' championship
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {driverTips.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No driver tips yet
                </p>
              ) : (
                driverTips.map(({ driver, users }) => (
                  <TipCard
                    key={driver.id}
                    users={users}
                    currentUserId={currentUserId}
                  >
                    <div
                      className='relative isolate p-3 border-b'
                      style={{
                        ...getDriverStyle(driver.constructorId),
                      }}
                    >
                      <p className='relative z-10 pr-2 font-medium'>
                        {driver.givenName} {driver.familyName}
                      </p>
                      <p
                        className='text-3xl font-bold font-mono absolute right-2 inset-y-0 flex items-center justify-center text-transparent bg-clip-text'
                        style={{
                          backgroundImage: `linear-gradient(to bottom, ${getConstructorCssVariable(driver.constructorId, 0.3)}, ${getConstructorCssVariable(driver.constructorId, 0.1)})`,
                        }}
                      >
                        {driver.permanentNumber}
                      </p>
                    </div>
                  </TipCard>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Constructor Championship</CardTitle>
              <CardDescription>
                Who everyone thinks will win the constructors' championship
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {constructorTips.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  No constructor tips yet
                </p>
              ) : (
                constructorTips.map(({ constructor, users }) => (
                  <TipCard
                    key={constructor.id}
                    users={users}
                    currentUserId={currentUserId}
                  >
                    <div
                      className='p-3 border-b'
                      style={{
                        backgroundColor: `${getConstructorCssVariable(constructor.id, 0.05)}`,
                      }}
                    >
                      <Constructor
                        constructor={constructor}
                        className='font-medium'
                      />
                    </div>
                  </TipCard>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TipCard({
  users,
  currentUserId,
  children,
}: {
  users: Array<{ id: string; name: string }>
  currentUserId: string
  children: React.ReactNode
}) {
  return (
    <div className='bg-background/50 overflow-hidden rounded-lg border'>
      {children}
      <div className='space-y-3 p-3'>
        {users.map((user) => (
          <div
            className={cn(
              'flex items-center gap-2',
              user.id === currentUserId && 'font-semibold',
            )}
            key={user.id}
          >
            <UserAvatar
              name={user.name}
              id={user.id}
              className='size-6 rounded-lg'
            />
            <p>{user.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function getDriverStyle(constructorId: string): React.CSSProperties {
  const colourStart = getConstructorCssVariable(constructorId, 0.01)
  const colourEnd = getConstructorCssVariable(constructorId, 0.1)
  return {
    backgroundImage: `linear-gradient(to left, ${colourStart}, ${colourEnd})`,
  }
}
