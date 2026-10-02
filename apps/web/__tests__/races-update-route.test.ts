import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Query = {
  operation: 'insert' | 'delete'
  table: string
  values?: Record<string, unknown>[]
  where?: unknown
}

const fixtures = vi.hoisted(() => {
  let feedRaces: Record<string, unknown>[] = []
  let storedRaces: Record<string, unknown>[] = []
  const queries: Query[] = []

  return {
    queries,
    reset() {
      feedRaces = []
      storedRaces = []
      queries.length = 0
    },
    setFeedRaces(next: Record<string, unknown>[]) {
      feedRaces = next
    },
    setStoredRaces(next: Record<string, unknown>[]) {
      storedRaces = next
    },
    getStoredRaces() {
      return storedRaces
    },
    fetchJolpica() {
      return Promise.resolve({ MRData: { RaceTable: { Races: feedRaces } } })
    },
  }
})

vi.mock('server-only', () => ({}))

vi.mock('@sentry/nextjs', () => ({
  captureException: () => {},
}))

vi.mock('next/cache', () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: () => unknown) => fn,
}))

vi.mock('@/app/api/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api/utils')>()
  return {
    ...actual,
    validateToken: () => Promise.resolve({ ok: true } as const),
    fetchJolpica: fixtures.fetchJolpica,
  }
})

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    inArray: (_column: unknown, values: unknown[]) => ({ inArray: values }),
  }
})

vi.mock('@/db', () => {
  function getTableName(table: object) {
    return Reflect.get(table, Symbol.for('drizzle:Name')) as string
  }

  function createQuery(operation: Query['operation'], table: string) {
    const query: Query = { operation, table }
    const builder = {
      values(values: Record<string, unknown>[]) {
        query.values = values
        return builder
      },
      where(where: unknown) {
        query.where = where
        return builder
      },
      onConflictDoUpdate() {
        return builder
      },
      returning() {
        return builder
      },
      then(onFulfilled: (rows: unknown) => unknown) {
        fixtures.queries.push(query)
        return Promise.resolve(query.values ?? []).then(onFulfilled)
      },
    }
    return builder
  }

  return {
    db: {
      query: {
        racesTable: {
          findMany: () => Promise.resolve(fixtures.getStoredRaces()),
        },
      },
      insert: (table: object) => createQuery('insert', getTableName(table)),
      delete: (table: object) => createQuery('delete', getTableName(table)),
    },
  }
})

import { GET } from '@/app/api/races/update/route'
import { NextRequest } from 'next/server'

function createFeedRace(circuitId: string, round: number, date: string) {
  return {
    round: String(round),
    raceName: `${circuitId} Grand Prix`,
    date,
    time: '13:00:00Z',
    Circuit: {
      circuitId,
      circuitName: circuitId,
      Location: { country: 'Country', locality: 'Locality' },
    },
    Qualifying: { date, time: '10:00:00Z' },
  }
}

function createStoredRace(
  id: string,
  circuitId: string,
  round: number,
  date: string,
) {
  return {
    id,
    season: 2026,
    circuitId,
    country: 'Country',
    round,
    circuitName: circuitId,
    raceName: `${circuitId} Grand Prix`,
    grandPrixDate: new Date(`${date}T13:00:00Z`),
    qualifyingDate: new Date(`${date}T10:00:00Z`),
    sprintDate: null,
    sprintQualifyingDate: null,
    locality: 'Locality',
  }
}

function createRequest() {
  return new NextRequest('https://gridtipapp.com/api/races/update')
}

describe('GET /api/races/update', () => {
  beforeEach(() => {
    fixtures.reset()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the id of a stored race and gives a new race a season-scoped id', async () => {
    fixtures.setStoredRaces([
      createStoredRace('albert_park', 'albert_park', 1, '2026-03-08'),
    ])
    fixtures.setFeedRaces([
      createFeedRace('albert_park', 1, '2026-03-15'),
      createFeedRace('madring', 2, '2026-09-13'),
    ])

    const response = await GET(createRequest())

    expect(response.status).toBe(201)
    const [upsert] = fixtures.queries
    expect(upsert).toMatchObject({
      operation: 'insert',
      table: 'races',
      values: [
        { id: 'albert_park', season: 2026, circuitId: 'albert_park' },
        { id: '2026-madring', season: 2026, circuitId: 'madring' },
      ],
    })
  })

  it('deletes upcoming races dropped from the calendar but keeps past ones', async () => {
    fixtures.setStoredRaces([
      createStoredRace('albert_park', 'albert_park', 1, '2026-03-08'),
      createStoredRace('imola', 'imola', 2, '2026-05-17'),
      createStoredRace('villeneuve', 'villeneuve', 3, '2026-06-14'),
      createStoredRace('zandvoort', 'zandvoort', 4, '2026-08-23'),
    ])
    fixtures.setFeedRaces([
      createFeedRace('albert_park', 1, '2026-03-08'),
      createFeedRace('zandvoort', 2, '2026-08-23'),
    ])

    const response = await GET(createRequest())

    expect(response.status).toBe(201)
    expect(fixtures.queries.map((query) => query.operation)).toEqual([
      'insert',
      'delete',
    ])
    expect(fixtures.queries[1]).toMatchObject({
      table: 'races',
      where: { inArray: ['villeneuve'] },
    })
  })

  it('reports no update when only a past race is missing from the feed', async () => {
    fixtures.setStoredRaces([
      createStoredRace('albert_park', 'albert_park', 1, '2026-03-08'),
      createStoredRace('imola', 'imola', 2, '2026-05-17'),
    ])
    fixtures.setFeedRaces([createFeedRace('albert_park', 1, '2026-03-08')])

    const response = await GET(createRequest())

    expect(response.status).toBe(200)
    expect(fixtures.queries).toEqual([])
  })

  it('deletes nothing when the feed has no races', async () => {
    fixtures.setStoredRaces([
      createStoredRace('zandvoort', 'zandvoort', 1, '2026-08-23'),
    ])

    const response = await GET(createRequest())

    expect(response.status).toBe(404)
    expect(fixtures.queries).toEqual([])
  })
})
