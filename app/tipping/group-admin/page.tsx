import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmptyGroup from '@/components/empty-group'
import { verifyIsAdmin, verifySession } from '@/lib/dal'
import { PredictionsTableWrapper } from './_components/predictions-table-wrapper'
import {
  getConstructorOptions,
  getCurrentGroup,
  getDriverOptions,
  getGroupMembers,
} from '@/lib/utils/groups'
import { createGetAllPredictions } from '@/lib/utils/race-results'
import { redirect } from 'next/navigation'
import { formatPredictionsToRows } from './_utils/rows'
import { unstable_cache } from 'next/cache'
import { db } from '@/db'
import { CacheTag } from '@/constants/cache'
import CreateOrEditTipDialog, {
  TipFormData,
} from './_components/create-edit-tip-dialog'
import TipFormProvider from './_components/edit-tip-context'
import React from 'react'
import { ChampionshipRevealDate } from './_components/championship-reveal-date'
import { PredictionMember } from './types/prediction-member'
import { Database } from '@/db/types'
import { ChampionshipPoints } from './_components/championship-points'

export default async function GroupSettings() {
  const { userId } = await verifySession()
  const group = await getCurrentGroup(userId)

  if (!group) {
    return <EmptyGroup />
  }

  const { isAdmin } = await verifyIsAdmin(group.id)

  if (!isAdmin) {
    redirect('/tipping')
  }

  enum Tab {
    Championships = 'championships',
    RacePredictions = 'predictions',
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='page-title'>{group.name}</h1>
        <p className='text-muted-foreground'>
          Manage this group through admin settings.
        </p>
      </div>
      <Tabs defaultValue={Tab.RacePredictions}>
        <TabsList className='mb-4'>
          <TabsTrigger value={Tab.RacePredictions}>
            Race Predictions
          </TabsTrigger>
          <TabsTrigger value={Tab.Championships}>Championships</TabsTrigger>
        </TabsList>
        <TabsContent value={Tab.Championships}>
          <ChampionshipsTab group={group} />
        </TabsContent>
        <TabsContent value={Tab.RacePredictions}>
          <PredictionTab group={group} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function ChampionshipsTab({
  group,
}: {
  group: Pick<
    Database.Group,
    | 'id'
    | 'championshipTipsRevalDate'
    | 'driversChampionshipPoints'
    | 'constructorsChampionshipPoints'
  >
}) {
  return (
    <div className='space-y-8'>
      <ChampionshipPoints group={group} />
      <ChampionshipRevealDate
        groupId={group.id}
        currentDate={group.championshipTipsRevalDate}
      />
    </div>
  )
}

async function PredictionTab({ group }: { group: Pick<Database.Group, 'id'> }) {
  const [predictions, constructors, drivers, races, rawMembers] =
    await Promise.all([
      createGetAllPredictions(group.id)(),
      getConstructorOptions(),
      getDriverOptions(),
      getRaces(),
      getGroupMembers(group.id),
    ])

  const members = rawMembers.map((member) => ({
    name: member.name,
    id: member.id,
    imageSrc: member.profileImageUrl,
  })) satisfies PredictionMember[]

  const constructorMap = new Map(
    constructors.map((constructor) => [constructor.id, constructor]),
  )
  const driverMap = new Map(drivers.map((driver) => [driver.id, driver]))
  const raceMap = new Map(races.map((race) => [race.id, race]))

  const rows = formatPredictionsToRows(predictions, {
    constructor: constructorMap,
    driver: driverMap,
    race: raceMap,
  })

  const formProps: TipFormData = {
    users: members,
    races,
    constructors,
    drivers,
  }
  return (
    <section className='space-y-4'>
      <div className='flex gap-x-4 flex-wrap justify-between items-end gap-y-2'>
        <div className='space-y-1'>
          <h2 className='title-2'>Predictions</h2>
          <p className='text-muted-foreground'>
            View predictions, update them or create a new prediction for a group
            member.
          </p>
        </div>
        <CreateOrEditTipDialog {...formProps} />
      </div>
      <TipFormProvider context={formProps}>
        <PredictionsTableWrapper rows={rows} races={races} users={members} />
      </TipFormProvider>
    </section>
  )
  function getRaces() {
    return unstable_cache(
      async () =>
        await db.query.racesTable.findMany({
          columns: {
            id: true,
            locality: true,
            country: true,
            grandPrixDate: true,
            sprintQualifyingDate: true,
          },
        }),
      [],
      {
        tags: [CacheTag.Races],
      },
    )()
  }
}
