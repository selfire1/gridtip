import { isAfterChampionshipDeadline } from '@/lib/utils/championship-deadline'
import { describe, expect, it } from 'vitest'

describe('isAfterChampionshipDeadline', () => {
  const givenFirstRace = {
    qualifyingDate: new Date('2025-03-15T05:00:00.000Z'),
  }

  it('is open before the first qualifying session', () => {
    const givenDate = new Date('2025-03-15T04:59:00.000Z')
    expect(isAfterChampionshipDeadline(givenFirstRace, givenDate)).toBe(false)
  })

  it('is closed after the first qualifying session', () => {
    const givenDate = new Date('2025-03-15T05:01:00.000Z')
    expect(isAfterChampionshipDeadline(givenFirstRace, givenDate)).toBe(true)
  })

  it('is open when there is no first race', () => {
    expect(isAfterChampionshipDeadline(undefined)).toBe(false)
  })
})
