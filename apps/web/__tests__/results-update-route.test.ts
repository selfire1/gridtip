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
  const batches: BatchedQuery[][] = []
  const queriesRunOutsideBatch: BatchedQuery[] = []

  return {
    batches,
    queriesRunOutsideBatch,
    reset() {
      pages = {}
      storedResults = []
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
const QUALIFYING_PATH = '/ergast/f1/2026/qualifying/'

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

function createQualifyingPage(
  total: number,
  results: { driverId: string; position: string }[],
) {
  return {
    MRData: {
      total: total.toString(),
      RaceTable: {
        Races: [
          {
            round: '12',
            Circuit: { circuitId: 'zandvoort' },
            QualifyingResults: results.map((result) => {
              return {
                position: result.position,
                Driver: { driverId: result.driverId },
              }
            }),
          },
        ],
      },
    },
  }
}

function getInsertedResults() {
  const insert = fixtures.batches[0]?.find((query) => {
    return query.operation === 'insert' && query.table === 'results'
  })
  return insert?.values
}

function createRequest() {
  return new NextRequest('https://gridtipapp.com/api/results/update')
}

describe('GET /api/results/update', () => {
  beforeEach(() => {
    fixtures.reset()
    fixtures.setPages(
      pagesWithQualifying([{ driverId: 'tsunoda', position: '3' }]),
    )
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

  it('stores the qualifying position next to the race grid', async () => {
    await GET(createRequest())

    expect(getInsertedResults()).toMatchObject([
      { driverId: 'tsunoda', qualifying: 3, grid: 1 },
    ])
  })

  it('stores no qualifying position for a driver missing from qualifying', async () => {
    fixtures.setPages(pagesWithQualifying([]))

    const response = await GET(createRequest())

    expect(response.status).toBe(201)
    expect(getInsertedResults()?.[0].qualifying ?? null).toBeNull()
  })

  it('applies qualifying positions from later pages', async () => {
    fixtures.setPages({
      ...pagesWithQualifying([]),
      [QUALIFYING_PATH]: [
        createQualifyingPage(101, []),
        createQualifyingPage(101, [{ driverId: 'tsunoda', position: '3' }]),
      ],
    })

    await GET(createRequest())

    expect(getInsertedResults()).toMatchObject([{ qualifying: 3 }])
  })

  it('rewrites the results when only the qualifying position changed', async () => {
    fixtures.setStoredResults([
      {
        raceId: 'zandvoort',
        driverId: 'tsunoda',
        sprint: null,
        constructorId: 'rb',
        qualifying: 5,
        grid: 1,
        position: 1,
        points: 25,
        status: 'Finished',
      },
    ])

    const response = await GET(createRequest())

    expect(response.status).toBe(201)
    expect(fixtures.batches).toHaveLength(1)
  })
})

function pagesWithQualifying(
  results: { driverId: string; position: string }[],
) {
  return {
    [SPRINT_PATH]: [{ MRData: { total: '0', RaceTable: { Races: [] } } }],
    [QUALIFYING_PATH]: [createQualifyingPage(1, results)],
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
  }
}
