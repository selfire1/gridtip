import { beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = vi.hoisted(() => {
  let storedResults: Record<string, unknown>[] = []
  return {
    setStoredResults(next: Record<string, unknown>[]) {
      storedResults = next
    },
    getStoredResults() {
      return storedResults
    },
  }
})

vi.mock('server-only', () => ({}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
}))

vi.mock('@/db', () => ({
  db: {
    query: {
      resultsTable: {
        findMany: () => Promise.resolve(fixtures.getStoredResults()),
      },
    },
  },
}))

import { getRaceIdToResultMap } from '@/lib/utils/race-results'

function createStoredResult(overrides: {
  driverId: string
  qualifying: number | null
  grid: number | null
  position: number
}) {
  return {
    raceId: 'zandvoort',
    driverId: overrides.driverId,
    constructorId: 'mclaren',
    sprint: null,
    qualifying: overrides.qualifying,
    grid: overrides.grid,
    position: overrides.position,
    points: 0,
    status: 'Finished',
    driver: {
      id: overrides.driverId,
      constructorId: 'mclaren',
      givenName: overrides.driverId,
      familyName: overrides.driverId,
    },
    constructor: { id: 'mclaren', name: 'McLaren' },
  }
}

async function getQualifying() {
  const resultsMap = await getRaceIdToResultMap()
  return resultsMap?.get('zandvoort')?.qualifying
}

describe('getRaceIdToResultMap', () => {
  beforeEach(() => {
    fixtures.setStoredResults([])
  })

  it('takes pole from qualifying, not the starting grid', async () => {
    fixtures.setStoredResults([
      createStoredResult({
        driverId: 'norris',
        qualifying: 1,
        grid: 6,
        position: 1,
      }),
      createStoredResult({
        driverId: 'piastri',
        qualifying: 2,
        grid: 1,
        position: 2,
      }),
    ])

    const qualifying = await getQualifying()

    expect(qualifying?.get(1)?.id).toBe('norris')
    expect(qualifying?.get(2)?.id).toBe('piastri')
  })

  it('leaves out drivers without a qualifying position', async () => {
    fixtures.setStoredResults([
      createStoredResult({
        driverId: 'norris',
        qualifying: 1,
        grid: 1,
        position: 1,
      }),
      createStoredResult({
        driverId: 'hulkenberg',
        qualifying: null,
        grid: 0,
        position: 2,
      }),
      createStoredResult({
        driverId: 'bortoleto',
        qualifying: null,
        grid: 0,
        position: 3,
      }),
    ])

    const qualifying = await getQualifying()

    expect([...(qualifying?.keys() ?? [])]).toEqual([1])
  })
})
