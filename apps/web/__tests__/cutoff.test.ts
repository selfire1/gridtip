import {
  getClosedFields,
  isRaceAbleToBeTipped,
  omitClosedFields,
  throwIfAnyNewFieldIsAfterCutoff,
} from '@/lib/utils/prediction-fields'
import { describe, expect, it } from 'vitest'
import { getIsSprint } from '@gridtip/shared/is-sprint'

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

describe('submitting tips after cutoff', () => {
  type ExistingEntries = Parameters<typeof throwIfAnyNewFieldIsAfterCutoff>[4]
  const givenRace = {
    qualifyingDate: new Date('2025-10-18T21:00:00.000Z'),
    sprintQualifyingDate: new Date('2025-10-17T21:30:00.000Z'),
  }
  const givenGroup = { cutoffInMinutes: 0 }
  const givenDate = new Date('2025-10-19T21:00:00.000Z')

  it('rejects adding a position to an existing prediction', () => {
    const existing: ExistingEntries = [
      {
        position: 'constructorWithMostPoints',
        driverId: null,
        constructorId: 'mclaren',
      },
    ]
    expect(() => {
      throwIfAnyNewFieldIsAfterCutoff(
        givenRace,
        givenDate,
        {
          constructorWithMostPoints: { id: 'mclaren' },
          pole: { id: 'norris' },
        },
        givenGroup,
        existing,
      )
    }).toThrow('Cannot predict pole after cutoff')
  })

  it('rejects a new prediction', () => {
    expect(() => {
      throwIfAnyNewFieldIsAfterCutoff(
        givenRace,
        givenDate,
        { pole: { id: 'norris' } },
        givenGroup,
        [],
      )
    }).toThrow('Cannot predict pole after cutoff')
  })

  it('rejects changing a saved position', () => {
    const existing: ExistingEntries = [
      { position: 'pole', driverId: 'norris', constructorId: null },
    ]
    expect(() => {
      throwIfAnyNewFieldIsAfterCutoff(
        givenRace,
        givenDate,
        { pole: { id: 'piastri' } },
        givenGroup,
        existing,
      )
    }).toThrow('Cannot predict pole after cutoff')
  })

  it('accepts resubmitting unchanged closed positions', () => {
    const existing: ExistingEntries = [
      { position: 'pole', driverId: 'norris', constructorId: null },
      {
        position: 'constructorWithMostPoints',
        driverId: null,
        constructorId: 'mclaren',
      },
    ]
    expect(() => {
      throwIfAnyNewFieldIsAfterCutoff(
        givenRace,
        givenDate,
        {
          pole: { id: 'norris' },
          constructorWithMostPoints: { id: 'mclaren' },
        },
        givenGroup,
        existing,
      )
    }).not.toThrow()
  })

  it('accepts new positions before cutoff', () => {
    const existing: ExistingEntries = [
      {
        position: 'constructorWithMostPoints',
        driverId: null,
        constructorId: 'mclaren',
      },
    ]
    expect(() => {
      throwIfAnyNewFieldIsAfterCutoff(
        givenRace,
        new Date('2025-10-16T21:00:00.000Z'),
        {
          constructorWithMostPoints: { id: 'mclaren' },
          pole: { id: 'norris' },
        },
        givenGroup,
        existing,
      )
    }).not.toThrow()
  })
})

describe('omitClosedFields', () => {
  it('removes closed positions and keeps the rest', () => {
    const data = {
      sprintP1: { id: 'max' },
      pole: { id: 'lando' },
      groupId: 'group',
      raceId: 'race',
    }
    const result = omitClosedFields(data, new Set(['sprintP1']))
    expect(result).toEqual({
      pole: { id: 'lando' },
      groupId: 'group',
      raceId: 'race',
    })
  })

  it('keeps all fields when nothing is closed', () => {
    const data = { pole: { id: 'lando' }, groupId: 'group' }
    expect(omitClosedFields(data, new Set())).toEqual(data)
  })
})
