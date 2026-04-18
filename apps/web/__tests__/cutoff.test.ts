import {
  getClosedFields,
  getIsSprint,
  isRaceAbleToBeTipped,
} from '@/lib/utils/prediction-fields'
import { describe, expect, it } from 'vitest'

describe('sprint race', () => {
  const givenRace = {
    id: 'americas',
    country: 'USA',
    round: 19,
    circuitName: 'Circuit of the Americas',
    raceName: 'United States Grand Prix',
    grandPrixDate: new Date('2025-10-19T19:00:00.000Z'),
    qualifyingDate: new Date('2025-10-18T21:00:00.000Z'),
    sprintDate: new Date('2025-10-18T17:00:00.000Z'),
    sprintQualifyingDate: new Date('2025-10-17T21:30:00.000Z'),
    locality: 'Austin',
    lastUpdated: new Date('2025-10-17T10:01:13.000Z'),
    created: new Date('2025-03-10T09:33:56.000Z'),
  }

  const givenDate = new Date('2025-10-18T09:56:06+1000') // after sprint cutoff
  const givenCutoff = 0
  it('sets sprintP1 as closed', () => {
    const result = getClosedFields(givenRace, givenCutoff, givenDate)
    expect(result).toEqual(new Set(['sprintP1']))
  })
  it('counts race as sprint race', () => {
    const result = getIsSprint(givenRace)
    expect(result).toBe(true)
  })
  it('is not closed if sprint race', () => {
    const result = isRaceAbleToBeTipped(givenRace, givenCutoff, givenDate)
    expect(result).toBe(true)
  })
})
