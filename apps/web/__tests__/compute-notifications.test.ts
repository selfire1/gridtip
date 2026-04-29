import { describe, expect, it } from 'vitest'
import {
  computeNotificationsToSend,
  type ComputeNotificationsInput,
  type SchedulerMembership,
  type SchedulerPrediction,
  type SchedulerRace,
  type SchedulerUser,
} from '@/lib/notifications/compute-notifications'
import { addHours, addMinutes, subHours } from 'date-fns'

const NOW = new Date('2026-04-26T12:00:00.000Z')

function user(overrides: Partial<SchedulerUser> = {}): SchedulerUser {
  return {
    id: 'user-1',
    enableNotifications: true,
    pushTokens: ['ExponentPushToken[abc]'],
    ...overrides,
  }
}

function membership(
  overrides: Partial<SchedulerMembership> = {},
): SchedulerMembership {
  return {
    userId: 'user-1',
    groupId: 'group-1',
    cutoffInMinutes: 180,
    ...overrides,
  }
}

/**
 * Build a race whose GP qualifying date sits exactly `hoursFromNow` after NOW
 * (after subtracting `cutoffInMinutes`). Sprint qualifying defaults to 24h
 * before GP qualifying when sprint=true.
 */
function race(opts: {
  id?: string
  hoursUntilGpCutoff: number
  cutoffInMinutes?: number
  sprintHoursUntilCutoff?: number | null
  groupIds?: string[]
}): SchedulerRace {
  const cutoff = opts.cutoffInMinutes ?? 180
  const gpQualifying = addMinutes(
    addHours(NOW, opts.hoursUntilGpCutoff),
    cutoff,
  )
  const sprintQualifying =
    opts.sprintHoursUntilCutoff == null
      ? null
      : addMinutes(addHours(NOW, opts.sprintHoursUntilCutoff), cutoff)
  return {
    id: opts.id ?? 'race-1',
    qualifyingDate: gpQualifying,
    sprintQualifyingDate: sprintQualifying,
    groupIds: opts.groupIds ?? ['group-1'],
  }
}

function prediction(
  overrides: Partial<SchedulerPrediction> = {},
): SchedulerPrediction {
  return { userId: 'user-1', raceId: 'race-1', ...overrides }
}

function input(
  overrides: Partial<ComputeNotificationsInput> = {},
): ComputeNotificationsInput {
  return {
    now: NOW,
    users: [user()],
    memberships: [membership()],
    races: [race({ hoursUntilGpCutoff: 23.5 })],
    predictions: [],
    alreadySent: [],
    ...overrides,
  }
}

describe('computeNotificationsToSend', () => {
  it('not tipped, 24h before cutoff -> standard 24h', () => {
    const result = computeNotificationsToSend(input())
    expect(result).toEqual([
      {
        userId: 'user-1',
        pushTokens: ['ExponentPushToken[abc]'],
        raceId: 'race-1',
        tipType: 'race',
        reminderType: '24h',
        variant: 'standard',
      },
    ])
  })

  it('not tipped, 3h before cutoff with 24h already sent -> standard 3h', () => {
    const result = computeNotificationsToSend(
      input({
        races: [race({ hoursUntilGpCutoff: 2.5 })],
        alreadySent: [
          {
            userId: 'user-1',
            raceId: 'race-1',
            tipType: 'race',
            reminderType: '24h',
          },
        ],
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      reminderType: '3h',
      variant: 'standard',
    })
  })

  it('tipped, 24h before cutoff -> last-chance 24h', () => {
    const result = computeNotificationsToSend(
      input({ predictions: [prediction()] }),
    )
    expect(result).toEqual([
      expect.objectContaining({
        reminderType: '24h',
        variant: 'last-chance',
      }),
    ])
  })

  it('tipped, 3h before cutoff -> no notification', () => {
    const result = computeNotificationsToSend(
      input({
        races: [race({ hoursUntilGpCutoff: 2.5 })],
        predictions: [prediction()],
        alreadySent: [
          {
            userId: 'user-1',
            raceId: 'race-1',
            tipType: 'race',
            reminderType: '24h',
          },
        ],
      }),
    )
    expect(result).toEqual([])
  })

  it('two groups with cutoffInMinutes 60 and 1440 -> schedules off the 1440 group (earlier cutoff)', () => {
    const cutoffSmall = 60
    const cutoffLarge = 1440
    // GP qualifying at NOW + 25h. With cutoffSmall=60min, cutoff is at NOW+24h => not in window (>24h).
    // With cutoffLarge=1440min, cutoff is at NOW+1h => in 3h window.
    const gpQualifying = addHours(NOW, 25)
    const races: SchedulerRace[] = [
      {
        id: 'race-1',
        qualifyingDate: gpQualifying,
        sprintQualifyingDate: null,
        groupIds: ['group-1', 'group-2'],
      },
    ]
    const memberships: SchedulerMembership[] = [
      { userId: 'user-1', groupId: 'group-1', cutoffInMinutes: cutoffSmall },
      { userId: 'user-1', groupId: 'group-2', cutoffInMinutes: cutoffLarge },
    ]

    const result = computeNotificationsToSend({
      now: NOW,
      users: [user()],
      memberships,
      races,
      predictions: [],
      alreadySent: [],
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      reminderType: '3h',
      variant: 'standard',
    })
  })

  it('sprint weekend, no tips, 24h windows -> emits both sprint and GP 24h reminders', () => {
    const r = race({
      hoursUntilGpCutoff: 23.5,
      sprintHoursUntilCutoff: 23.4,
    })
    const result = computeNotificationsToSend(input({ races: [r] }))
    expect(result).toHaveLength(2)
    const tipTypes = result.map((n) => n.tipType).sort()
    expect(tipTypes).toEqual(['race', 'sprint'])
    for (const n of result) {
      expect(n.reminderType).toBe('24h')
      expect(n.variant).toBe('standard')
    }
  })

  it('sprint weekend, tipped, 24h windows -> last-chance for both, none at 3h', () => {
    const r = race({
      hoursUntilGpCutoff: 23.5,
      sprintHoursUntilCutoff: 23.4,
    })
    const result = computeNotificationsToSend(
      input({ races: [r], predictions: [prediction()] }),
    )
    expect(result).toHaveLength(2)
    for (const n of result) {
      expect(n.reminderType).toBe('24h')
      expect(n.variant).toBe('last-chance')
    }
  })

  it('alreadySent row exists -> skipped', () => {
    const result = computeNotificationsToSend(
      input({
        alreadySent: [
          {
            userId: 'user-1',
            raceId: 'race-1',
            tipType: 'race',
            reminderType: '24h',
          },
        ],
      }),
    )
    expect(result).toEqual([])
  })

  it('enableNotifications=false -> user excluded', () => {
    const result = computeNotificationsToSend(
      input({ users: [user({ enableNotifications: false })] }),
    )
    expect(result).toEqual([])
  })

  it('enableNotifications=null -> user excluded', () => {
    const result = computeNotificationsToSend(
      input({ users: [user({ enableNotifications: null })] }),
    )
    expect(result).toEqual([])
  })

  it('no push tokens -> user excluded', () => {
    const result = computeNotificationsToSend(
      input({ users: [user({ pushTokens: [] })] }),
    )
    expect(result).toEqual([])
  })

  it('cutoff in past -> excluded', () => {
    const r: SchedulerRace = {
      id: 'race-1',
      qualifyingDate: subHours(NOW, 5),
      sprintQualifyingDate: null,
      groupIds: ['group-1'],
    }
    const result = computeNotificationsToSend(input({ races: [r] }))
    expect(result).toEqual([])
  })

  it('both 24h and 3h windows applicable simultaneously -> only the matching one fires (3h)', () => {
    const result = computeNotificationsToSend(
      input({ races: [race({ hoursUntilGpCutoff: 2.5 })] }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].reminderType).toBe('3h')
  })

  it('tipped in any group counts as tipped (per-user)', () => {
    const memberships: SchedulerMembership[] = [
      { userId: 'user-1', groupId: 'group-1', cutoffInMinutes: 180 },
      { userId: 'user-1', groupId: 'group-2', cutoffInMinutes: 180 },
    ]
    const r = race({
      hoursUntilGpCutoff: 23.5,
      groupIds: ['group-1', 'group-2'],
    })
    const result = computeNotificationsToSend(
      input({
        memberships,
        races: [r],
        predictions: [prediction()],
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].variant).toBe('last-chance')
  })

  it('two users with different tip statuses -> independent verdicts', () => {
    const users: SchedulerUser[] = [
      user({ id: 'user-1' }),
      user({ id: 'user-2' }),
    ]
    const memberships: SchedulerMembership[] = [
      { userId: 'user-1', groupId: 'group-1', cutoffInMinutes: 180 },
      { userId: 'user-2', groupId: 'group-1', cutoffInMinutes: 180 },
    ]
    const result = computeNotificationsToSend(
      input({
        users,
        memberships,
        predictions: [prediction({ userId: 'user-1' })],
      }),
    )
    expect(result).toHaveLength(2)
    const byUser = Object.fromEntries(result.map((n) => [n.userId, n]))
    expect(byUser['user-1'].variant).toBe('last-chance')
    expect(byUser['user-2'].variant).toBe('standard')
  })

  it('multiple devices -> output carries both tokens', () => {
    const result = computeNotificationsToSend(
      input({
        users: [
          user({ pushTokens: ['ExponentPushToken[a]', 'ExponentPushToken[b]'] }),
        ],
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].pushTokens).toEqual([
      'ExponentPushToken[a]',
      'ExponentPushToken[b]',
    ])
  })

  it('non-sprint race -> no sprint notifications even if other races have sprint', () => {
    const nonSprint: SchedulerRace = {
      id: 'race-1',
      qualifyingDate: addMinutes(addHours(NOW, 23.5), 180),
      sprintQualifyingDate: null,
      groupIds: ['group-1'],
    }
    const result = computeNotificationsToSend(input({ races: [nonSprint] }))
    expect(result).toHaveLength(1)
    expect(result[0].tipType).toBe('race')
  })
})
