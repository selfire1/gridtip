import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.TURSO_DATABASE_URL = ':memory:'
})

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
}))

const { db } = await import('@/db')
const { getRaces } = await import('@/lib/utils/races')

describe('getRaces', () => {
  beforeAll(async () => {
    await db.run(`
      CREATE TABLE races (
        id text PRIMARY KEY NOT NULL,
        country text NOT NULL,
        round integer NOT NULL,
        circuit_name text NOT NULL,
        race_name text NOT NULL,
        grand_prix_date integer NOT NULL,
        qualifying_date integer NOT NULL,
        locality text NOT NULL,
        last_updated integer NOT NULL,
        created integer NOT NULL DEFAULT (unixepoch()),
        sprint_date integer,
        sprint_qualifying_date integer
      )
    `)
    await db.run(`
      INSERT INTO races (id, country, round, circuit_name, race_name, grand_prix_date, qualifying_date, locality, last_updated) VALUES
        ('baku', 'Azerbaijan', 15, 'Baku City Circuit', 'Azerbaijan Grand Prix', 1790420400, 1790337600, 'Baku', 0),
        ('marina_bay', 'Singapore', 17, 'Marina Bay Street Circuit', 'Singapore Grand Prix', 1791720000, 1791637200, 'Marina Bay', 0),
        ('sepang', 'Malaysia', 16, 'Sepang International Circuit', 'Bahrain Grand Prix in Malaysia', 1791097200, 1791014400, 'Kuala Lumpur', 0)
    `)
  })

  it('returns races ordered by round even when a race was inserted mid-season', async () => {
    const races = await getRaces()
    expect(races.map((race) => race.id)).toEqual(['baku', 'sepang', 'marina_bay'])
  })

  it('has a flag for every country', async () => {
    const races = await getRaces()
    for (const race of races) {
      expect(race.image, race.country).toBeDefined()
    }
  })
})
