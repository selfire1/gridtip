import { assignRaceIds, getRaceIdsToDelete } from '@/lib/utils/race-sync'
import { describe, expect, it } from 'vitest'

describe('assignRaceIds', () => {
  it('keeps the id of the stored race at the same circuit', () => {
    const givenStoredRaces = [{ id: 'albert_park', circuitId: 'albert_park' }]
    const givenFeedRaces = [{ season: 2026, circuitId: 'albert_park' }]

    expect(assignRaceIds(givenFeedRaces, givenStoredRaces)).toEqual([
      { id: 'albert_park', season: 2026, circuitId: 'albert_park' },
    ])
  })

  it('gives a race not stored yet a season-scoped id', () => {
    const givenStoredRaces = [{ id: 'albert_park', circuitId: 'albert_park' }]
    const givenFeedRaces = [
      { season: 2026, circuitId: 'albert_park' },
      { season: 2026, circuitId: 'madring' },
    ]

    expect(
      assignRaceIds(givenFeedRaces, givenStoredRaces).map((race) => race.id),
    ).toEqual(['albert_park', '2026-madring'])
  })

  it('does not reuse a race from another season when none is stored for this one', () => {
    expect(
      assignRaceIds([{ season: 2027, circuitId: 'albert_park' }], []),
    ).toEqual([
      { id: '2027-albert_park', season: 2027, circuitId: 'albert_park' },
    ])
  })
})

describe('getRaceIdsToDelete', () => {
  const givenNow = new Date('2026-06-01T00:00:00.000Z')
  const givenStoredRaces = [
    {
      id: 'albert_park',
      circuitId: 'albert_park',
      grandPrixDate: new Date('2026-03-08T04:00:00.000Z'),
    },
    {
      id: 'imola',
      circuitId: 'imola',
      grandPrixDate: new Date('2026-05-17T13:00:00.000Z'),
    },
    {
      id: 'villeneuve',
      circuitId: 'villeneuve',
      grandPrixDate: new Date('2026-06-14T18:00:00.000Z'),
    },
    {
      id: 'zandvoort',
      circuitId: 'zandvoort',
      grandPrixDate: new Date('2026-08-23T13:00:00.000Z'),
    },
  ]

  it('deletes future races that are missing from the feed', () => {
    const givenFeedRaces = [
      { circuitId: 'albert_park' },
      { circuitId: 'imola' },
      { circuitId: 'zandvoort' },
    ]

    expect(
      getRaceIdsToDelete(givenStoredRaces, givenFeedRaces, givenNow),
    ).toEqual(['villeneuve'])
  })

  it('keeps races whose grand prix has passed even when the feed drops them', () => {
    const givenFeedRaces = [{ circuitId: 'zandvoort' }]

    expect(
      getRaceIdsToDelete(givenStoredRaces, givenFeedRaces, givenNow),
    ).toEqual(['villeneuve'])
  })

  it('deletes nothing when the feed is empty', () => {
    expect(getRaceIdsToDelete(givenStoredRaces, [], givenNow)).toEqual([])
  })

  it('handles dates serialized as strings by the cache', () => {
    const givenSerializedRaces = givenStoredRaces.map((race) => ({
      ...race,
      grandPrixDate: race.grandPrixDate.toISOString(),
    }))

    expect(
      getRaceIdsToDelete(
        givenSerializedRaces,
        [{ circuitId: 'imola' }],
        givenNow,
      ),
    ).toEqual(['villeneuve', 'zandvoort'])
  })
})
