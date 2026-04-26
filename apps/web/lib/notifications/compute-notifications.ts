import { subMinutes } from 'date-fns'
import { getIsSprint } from '@gridtip/shared/is-sprint'

export type SchedulerTipType = 'race' | 'sprint'
export type SchedulerReminderType = '24h' | '3h'
export type SchedulerVariant = 'standard' | 'last-chance'

export type SchedulerUser = {
  id: string
  enableNotifications: boolean | null
  pushTokens: string[]
}

export type SchedulerMembership = {
  userId: string
  groupId: string
  cutoffInMinutes: number
}

export type SchedulerRace = {
  id: string
  qualifyingDate: Date
  sprintQualifyingDate: Date | null
  /**
   * The set of group IDs that this race applies to. In practice this is "every
   * group", since races are global. Kept explicit for testability.
   */
  groupIds: string[]
}

export type SchedulerPrediction = {
  userId: string
  raceId: string
}

export type SchedulerAlreadySent = {
  userId: string
  raceId: string
  tipType: SchedulerTipType
  reminderType: SchedulerReminderType
}

export type ComputeNotificationsInput = {
  now: Date
  users: SchedulerUser[]
  memberships: SchedulerMembership[]
  races: SchedulerRace[]
  predictions: SchedulerPrediction[]
  alreadySent: SchedulerAlreadySent[]
}

export type NotificationToSend = {
  userId: string
  pushTokens: string[]
  raceId: string
  tipType: SchedulerTipType
  reminderType: SchedulerReminderType
  variant: SchedulerVariant
}

const ONE_HOUR_MS = 60 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS
const THREE_HOURS_MS = 3 * ONE_HOUR_MS

export function computeNotificationsToSend(
  input: ComputeNotificationsInput,
): NotificationToSend[] {
  const { now, users, memberships, races, predictions, alreadySent } = input

  const sentKey = new Set(
    alreadySent.map((s) => key(s.userId, s.raceId, s.tipType, s.reminderType)),
  )

  const tipped = new Set(predictions.map((p) => `${p.userId}|${p.raceId}`))

  const racesById = new Map(races.map((r) => [r.id, r]))

  const membershipsByUser = new Map<string, SchedulerMembership[]>()
  for (const m of memberships) {
    const list = membershipsByUser.get(m.userId) ?? []
    list.push(m)
    membershipsByUser.set(m.userId, list)
  }

  const out: NotificationToSend[] = []

  for (const user of users) {
    if (user.enableNotifications !== true) continue
    if (user.pushTokens.length === 0) continue

    const userMemberships = membershipsByUser.get(user.id) ?? []
    if (userMemberships.length === 0) continue

    const candidateRaces = collectRacesForUser(userMemberships, racesById)

    for (const { race, cutoffInMinutes } of candidateRaces) {
      const tipTypes: SchedulerTipType[] = ['race']
      if (getIsSprint(race)) tipTypes.push('sprint')

      for (const tipType of tipTypes) {
        const cutoff = computeCutoff(race, tipType, cutoffInMinutes)
        if (!cutoff) continue

        const remaining = cutoff.getTime() - now.getTime()
        if (remaining <= 0) continue

        const reminderType = classifyWindow(remaining)
        if (!reminderType) continue

        if (sentKey.has(key(user.id, race.id, tipType, reminderType))) continue

        const hasTipped = tipped.has(`${user.id}|${race.id}`)

        if (hasTipped && reminderType === '3h') continue

        out.push({
          userId: user.id,
          pushTokens: user.pushTokens,
          raceId: race.id,
          tipType,
          reminderType,
          variant: hasTipped ? 'last-chance' : 'standard',
        })
      }
    }
  }

  return out
}

function key(
  userId: string,
  raceId: string,
  tipType: SchedulerTipType,
  reminderType: SchedulerReminderType,
) {
  return `${userId}|${raceId}|${tipType}|${reminderType}`
}

function classifyWindow(remainingMs: number): SchedulerReminderType | null {
  if (remainingMs > TWENTY_FOUR_HOURS_MS) return null
  if (remainingMs > THREE_HOURS_MS) return '24h'
  return '3h'
}

function computeCutoff(
  race: SchedulerRace,
  tipType: SchedulerTipType,
  cutoffInMinutes: number,
): Date | null {
  if (tipType === 'sprint') {
    if (!race.sprintQualifyingDate) return null
    return subMinutes(race.sprintQualifyingDate, cutoffInMinutes)
  }
  return subMinutes(race.qualifyingDate, cutoffInMinutes)
}

/**
 * For each race accessible to the user (via any of their memberships), pick the
 * group with the *largest* cutoffInMinutes — the cutoff that fires earliest in
 * absolute time, i.e. the one furthest from the race. This guarantees the user
 * is reminded in time for every group they're in.
 */
function collectRacesForUser(
  memberships: SchedulerMembership[],
  racesById: Map<string, SchedulerRace>,
): { race: SchedulerRace; cutoffInMinutes: number }[] {
  const maxCutoffByRaceId = new Map<string, number>()

  for (const m of memberships) {
    for (const race of racesById.values()) {
      if (!race.groupIds.includes(m.groupId)) continue
      const current = maxCutoffByRaceId.get(race.id) ?? -Infinity
      if (m.cutoffInMinutes > current) {
        maxCutoffByRaceId.set(race.id, m.cutoffInMinutes)
      }
    }
  }

  const results: { race: SchedulerRace; cutoffInMinutes: number }[] = []
  for (const [raceId, cutoffInMinutes] of maxCutoffByRaceId) {
    const race = racesById.get(raceId)
    if (race) results.push({ race, cutoffInMinutes })
  }
  return results
}
