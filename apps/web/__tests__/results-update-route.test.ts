import { beforeEach, describe, expect, it, vi } from 'vitest'

type JolpicaPage = Record<string, unknown>

type BatchedQuery = {
  operation: 'insert' | 'delete'
  table: string
  values?: Record<string, unknown>[]
}

const fixtures = vi.hoisted(() => {
  let pages: Record<string, JolpicaPage[]> = {}
  let storedResults: Record<string, unknown>[] = []
  let storedRaces: Record<string, unknown>[] = []
  const batches: BatchedQuery[][] = []
  const queriesRunOutsideBatch: BatchedQuery[] = []

  return {
    batches,
    queriesRunOutsideBatch,
    reset() {
      pages = {}
      storedResults = []
      storedRaces = [{ id: 'zandvoort', circuitId: 'zandvoort' }]
      batches.length = 0
      queriesRunOutsideBatch.length = 0
    },
    setPages(next: Record<string, JolpicaPage[]>) {
      pages = next
    },
    setStoredResults(next: Record<string, unknown>[]) {
      storedResults = next
    },
    getStoredResults() {
      return storedResults
    },
    setStoredRaces(next: Record<string, unknown>[]) {
      storedRaces = next
    },
    getStoredRaces() {
      return storedRaces
    },
    fetchJolpica(path: string, options?: { params?: { offset?: number } }) {
      const offset = options?.params?.offset ?? 0
      const page = pages[path]?.[offset / 100]
      if (!page) {
        throw new Error(`no fixture for ${path} at offset ${offset}`)
      }
      return Promise.resolve(page)
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
    wait: () => Promise.resolve(undefined),
  }
})

vi.mock('@/db', () => {
  function getTableName(table: object) {
    return Reflect.get(table, Symbol.for('drizzle:Name')) as string
  }

  function createQuery(operation: BatchedQuery['operation'], table: string) {
    const query: BatchedQuery = { operation, table }
    const rows = () => (operation === 'insert' ? (query.values ?? []) : [])
    const builder = {
      query,
      rows,
      values(values: Record<string, unknown>[]) {
        query.values = values
        return builder
      },
      onConflictDoUpdate() {
        return builder
      },
      returning() {
        return builder
      },
      then(onFulfilled: (rows: unknown) => unknown) {
        fixtures.queriesRunOutsideBatch.push(query)
        return Promise.resolve(rows()).then(onFulfilled)
      },
    }
    return builder
  }

  type Builder = ReturnType<typeof createQuery>

  return {
    db: {
      query: {
        resultsTable: {
          findMany: () => Promise.resolve(fixtures.getStoredResults()),
        },
        racesTable: {
          findMany: () => Promise.resolve(fixtures.getStoredRaces()),
        },
      },
      insert: (table: object) => createQuery('insert', getTableName(table)),
      delete: (table: object) => createQuery('delete', getTableName(table)),
      batch: (queries: Builder[]) => {
        fixtures.batches.push(queries.map((builder) => builder.query))
        return Promise.resolve(queries.map((builder) => builder.rows()))
      },
    },
  }
})

import { GET } from '@/app/api/results/update/route'
import { NextRequest } from 'next/server'

const SPRINT_PATH = '/ergast/f1/2026/sprint/'
const RESULTS_PATH = '/ergast/f1/2026/results/'

function createResult(overrides: {
  driverId: string
  constructorId: string
  givenName: string
  familyName: string
}) {
  return {
    position: '1',
    positionText: '1',
    points: '25',
    grid: '1',
    status: 'Finished',
    Driver: {
      driverId: overrides.driverId,
      permanentNumber: '22',
      givenName: overrides.givenName,
      familyName: overrides.familyName,
      nationality: 'Japanese',
    },
    Constructor: { constructorId: overrides.constructorId },
  }
}

function createRequest() {
  return new NextRequest('https://gridtipapp.com/api/results/update')
}

describe('GET /api/results/update', () => {
  beforeEach(() => {
    fixtures.reset()
    fixtures.setPages({
      [SPRINT_PATH]: [{ MRData: { total: '0', RaceTable: { Races: [] } } }],
      [RESULTS_PATH]: [
        {
          MRData: {
            total: '1',
            RaceTable: {
              Races: [
                {
                  round: '12',
                  Circuit: { circuitId: 'zandvoort' },
                  Results: [
                    createResult({
                      driverId: 'tsunoda',
                      constructorId: 'rb',
                      givenName: 'Yuki',
                      familyName: 'Tsunoda',
                    }),
                  ],
                },
              ],
            },
          },
        },
      ],
    })
  })

  it('upserts the drivers named in the results before inserting them', async () => {
    const response = await GET(createRequest())

    expect(response.status).toBe(201)
    expect(fixtures.batches).toHaveLength(1)

    const [driversUpsert] = fixtures.batches[0]
    expect(driversUpsert).toMatchObject({
      operation: 'insert',
      table: 'drivers',
      values: [
        {
          id: 'tsunoda',
          fullName: 'Yuki Tsunoda',
          givenName: 'Yuki',
          familyName: 'Tsunoda',
          constructorId: 'rb',
        },
      ],
    })
  })

  it('replaces the results in a single batch so a rejected insert cannot empty the table', async () => {
    await GET(createRequest())

    expect(fixtures.batches).toHaveLength(1)
    expect(
      fixtures.batches[0].map((query) => `${query.operation} ${query.table}`),
    ).toEqual(['insert drivers', 'delete results', 'insert results'])
    expect(fixtures.queriesRunOutsideBatch).toEqual([])
  })

  it('keeps sprint positions from every page when a sprint straddles a page boundary', async () => {
    function createSprintPage(driverId: string, position: string) {
      return {
        MRData: {
          total: '101',
          RaceTable: {
            Races: [
              {
                Circuit: { circuitId: 'zandvoort' },
                SprintResults: [{ position, Driver: { driverId } }],
              },
            ],
          },
        },
      }
    }
    fixtures.setPages({
      [SPRINT_PATH]: [
        createSprintPage('tsunoda', '1'),
        createSprintPage('lawson', '2'),
      ],
      [RESULTS_PATH]: [
        {
          MRData: {
            total: '2',
            RaceTable: {
              Races: [
                {
                  round: '12',
                  Circuit: { circuitId: 'zandvoort' },
                  Results: [
                    createResult({
                      driverId: 'tsunoda',
                      constructorId: 'rb',
                      givenName: 'Yuki',
                      familyName: 'Tsunoda',
                    }),
                    createResult({
                      driverId: 'lawson',
                      constructorId: 'rb',
                      givenName: 'Liam',
                      familyName: 'Lawson',
                    }),
                  ],
                },
              ],
            },
          },
        },
      ],
    })

    await GET(createRequest())

    const resultsInsert = fixtures.batches[0][2]
    expect(resultsInsert.values).toMatchObject([
      { driverId: 'tsunoda', sprint: '1' },
      { driverId: 'lawson', sprint: '2' },
    ])
  })

  it('attaches results to the stored race of the season at that circuit', async () => {
    fixtures.setStoredRaces([{ id: '2027-zandvoort', circuitId: 'zandvoort' }])

    await GET(createRequest())

    const resultsInsert = fixtures.batches[0][2]
    expect(resultsInsert.values).toMatchObject([
      { raceId: '2027-zandvoort', driverId: 'tsunoda' },
    ])
  })

  it('fails without touching the results when a race is not stored yet', async () => {
    fixtures.setStoredRaces([])

    const response = await GET(createRequest())

    expect(response.status).toBe(500)
    expect(fixtures.batches).toEqual([])
  })
})
