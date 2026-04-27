import { db } from '@/db'
import { user } from '@/db/schema/auth-schema'
import {
  groupMembersTable,
  predictionsTable,
  raceNotificationsTable,
  racesTable,
} from '@/db/schema/schema'
import {
  computeNotificationsToSend,
  type SchedulerMembership,
  type SchedulerPrediction,
  type SchedulerRace,
  type SchedulerUser,
} from '@/lib/notifications/compute-notifications'
import { sendNotifications } from '@/lib/notifications/send'
import { addHours, subHours } from 'date-fns'
import { and, eq, gte } from 'drizzle-orm'

async function main() {
  const now = new Date()

  const horizonStart = subHours(now, 1)
  const horizonEnd = addHours(now, 36)

  const [
    rawUsers,
    rawTokens,
    rawMemberships,
    rawRaces,
    rawPredictions,
    rawSent,
  ] = await Promise.all([
    db.query.user.findMany({
      where: eq(user.enableNotifications, true),
      columns: { id: true, enableNotifications: true },
    }),
    db.query.userPushTokensTable.findMany({
      columns: { userId: true, token: true },
    }),
    db.query.groupMembersTable.findMany({
      columns: { userId: true, groupId: true },
      with: {
        group: { columns: { cutoffInMinutes: true } },
      },
    }),
    db.query.racesTable.findMany({
      columns: {
        id: true,
        qualifyingDate: true,
        sprintQualifyingDate: true,
      },
      where: and(
        gte(racesTable.qualifyingDate, horizonStart),
        // grandPrixDate guard not needed; we filter on qualifying horizon
      ),
    }),
    db
      .select({
        userId: groupMembersTable.userId,
        raceId: predictionsTable.raceId,
      })
      .from(predictionsTable)
      .innerJoin(
        groupMembersTable,
        eq(predictionsTable.memberId, groupMembersTable.id),
      )
      .where(eq(predictionsTable.isForChampionship, false)),
    db.query.raceNotificationsTable.findMany({
      columns: {
        userId: true,
        raceId: true,
        tipType: true,
        reminderType: true,
      },
      where: gte(raceNotificationsTable.sentAt, subHours(now, 48)),
    }),
  ])

  const tokensByUser = new Map<string, string[]>()
  for (const t of rawTokens) {
    const list = tokensByUser.get(t.userId) ?? []
    list.push(t.token)
    tokensByUser.set(t.userId, list)
  }

  const users: SchedulerUser[] = rawUsers.map((u) => ({
    id: u.id,
    enableNotifications: u.enableNotifications,
    pushTokens: tokensByUser.get(u.id) ?? [],
  }))

  const memberships: SchedulerMembership[] = rawMemberships.map((m) => ({
    userId: m.userId,
    groupId: m.groupId,
    cutoffInMinutes: m.group.cutoffInMinutes,
  }))

  const allGroupIds = Array.from(new Set(memberships.map((m) => m.groupId)))
  const races: SchedulerRace[] = rawRaces
    .filter((r) => r.qualifyingDate <= horizonEnd)
    .map((r) => ({
      id: r.id,
      qualifyingDate: r.qualifyingDate,
      sprintQualifyingDate: r.sprintQualifyingDate,
      groupIds: allGroupIds,
    }))

  const predictions: SchedulerPrediction[] = rawPredictions
    .filter((p): p is { userId: string; raceId: string } => p.raceId !== null)
    .map((p) => ({ userId: p.userId, raceId: p.raceId }))

  const notifications = computeNotificationsToSend({
    now,
    users,
    memberships,
    races,
    predictions,
    alreadySent: rawSent,
  })

  if (notifications.length === 0) {
    console.log('no notifications to send')
    return
  }

  console.log(`sending ${notifications.length} notification(s)`)

  const results = await sendNotifications(notifications)

  const successful = results.filter((r) => r.ok)
  if (successful.length > 0) {
    await db.insert(raceNotificationsTable).values(
      successful.map((r) => ({
        userId: r.notification.userId,
        raceId: r.notification.raceId,
        tipType: r.notification.tipType,
        reminderType: r.notification.reminderType,
      })),
    )
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length > 0) {
    console.error(`${failed.length} notification(s) failed`)
    for (const f of failed) {
      console.error(
        `  user=${f.notification.userId} race=${f.notification.raceId} ${f.notification.tipType}/${f.notification.reminderType}: ${f.error}`,
      )
    }
  }

  console.log(`sent ${successful.length}, failed ${failed.length}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
