import { selectNextRace } from '@/lib/utils/next-race'
import { describe, expect, it } from 'vitest'

describe('selectNextRace', () => {
  const givenRaces = [
    { id: 'r3', round: 3, grandPrixDate: new Date('2025-04-06T05:00:00.000Z') },
    { id: 'r1', round: 1, grandPrixDate: new Date('2025-03-16T04:00:00.000Z') },
    { id: 'r2', round: 2, grandPrixDate: new Date('2025-03-23T07:00:00.000Z') },
  ]

  it('picks the lowest round whose grand prix is still ahead', () => {
    const givenNow = new Date('2025-03-01T00:00:00.000Z')
    expect(selectNextRace(givenRaces, givenNow)?.id).toBe('r1')
  })

  it('moves on once a grand prix has started', () => {
    const givenNow = new Date('2025-03-16T04:00:00.000Z')
    expect(selectNextRace(givenRaces, givenNow)?.id).toBe('r2')
  })

  it('handles dates serialized as strings by the cache', () => {
    const givenSerializedRaces = givenRaces.map((race) => ({
      ...race,
      grandPrixDate: race.grandPrixDate.toISOString(),
    }))
    const givenNow = new Date('2025-03-20T00:00:00.000Z')
    expect(selectNextRace(givenSerializedRaces, givenNow)?.id).toBe('r2')
  })

  it('returns undefined after the last grand prix', () => {
    const givenNow = new Date('2025-12-01T00:00:00.000Z')
    expect(selectNextRace(givenRaces, givenNow)).toBeUndefined()
  })
})
