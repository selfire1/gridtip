import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
} from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'
import { user } from './auth-schema'
import { PREDICTION_FIELDS, DEFAULT_CUTOFF_MINS } from '@/constants'
import { relations, sql } from 'drizzle-orm'
import { SUPPORTED_ICON_NAMES } from '@/constants/icon-names'

export const TIP_OVERWRITE_OPTIONS = [
  'countAsCorrect',
  'countAsIncorrect',
] as const

export const groupsTable = sqliteTable('groups', {
  id: text().primaryKey().$defaultFn(createId),
  name: text().notNull(),
  adminUser: text()
    .notNull()
    .references(() => user.id, { onDelete: 'no action' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  cutoffInMinutes: integer('cutoff_in_minutes', { mode: 'number' })
    .default(DEFAULT_CUTOFF_MINS)
    .notNull(),
  iconName: text({ enum: SUPPORTED_ICON_NAMES })
    .notNull()
    .default('lucide:users'),
})

export const groupRelations = relations(groupsTable, ({ many, one }) => ({
  adminUser: one(user, {
    fields: [groupsTable.adminUser],
    references: [user.id],
  }),
}))

export const groupMembersTable = sqliteTable('group_members', {
  id: text('id').primaryKey().$defaultFn(createId),
  groupId: text('group_id')
    .notNull()
    .references(() => groupsTable.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // role: text("role").notNull(), TODO: admin, member
  joinedAt: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})

export const groupMembersRelations = relations(
  groupMembersTable,
  ({ one, many }) => ({
    group: one(groupsTable, {
      fields: [groupMembersTable.groupId],
      references: [groupsTable.id],
    }),
    user: one(user, {
      fields: [groupMembersTable.userId],
      references: [user.id],
    }),
  }),
)

export const racesTable = sqliteTable('races', {
  id: text('id').primaryKey().notNull(),
  country: text('country').notNull(),
  round: integer('round').notNull(),
  circuitName: text('circuit_name').notNull(),
  raceName: text('race_name').notNull(),
  grandPrixDate: integer({ mode: 'timestamp' }).notNull(),
  qualifyingDate: integer({ mode: 'timestamp' }).notNull(),
  sprintDate: integer({ mode: 'timestamp' }),
  sprintQualifyingDate: integer({ mode: 'timestamp' }),
  locality: text('locality').notNull(),
  lastUpdated: integer({ mode: 'timestamp' }).notNull(),
  created: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})

export const driversTable = sqliteTable('drivers', {
  id: text('id').primaryKey().notNull(),
  permanentNumber: text('permanent_number').notNull(),
  fullName: text('full_name').notNull(),
  givenName: text('given_name').notNull(),
  familyName: text('family_name').notNull(),
  nationality: text('nationality').notNull(),
  constructorId: text('constructor_id')
    .notNull()
    .references(() => constructorsTable.id, { onDelete: 'cascade' }),
  lastUpdated: integer({ mode: 'timestamp' }).notNull(),
  created: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})

export const constructorsTable = sqliteTable('constructors', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  nationality: text('nationality').notNull(),
  created: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  lastUpdated: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
})

export const predictionsTable = sqliteTable(
  'predictions',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => groupsTable.id, { onDelete: 'cascade' }),
    isForChampionship: integer({ mode: 'boolean' }).default(false).notNull(),
    raceId: text('race_id').references(() => racesTable.id, {
      onDelete: 'cascade',
    }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index('predictions_user_id_idx').on(table.userId),
    index('predictions_group_id_idx').on(table.groupId),
    index('predictions_is_for_championship_idx').on(table.isForChampionship),
    index('predictions_race_id_idx').on(table.raceId),
  ],
)

export const predictionRelations = relations(
  predictionsTable,
  ({ many, one }) => ({
    user: one(user, {
      fields: [predictionsTable.userId],
      references: [user.id],
    }),
    group: one(groupsTable, {
      fields: [predictionsTable.groupId],
      references: [groupsTable.id],
    }),
    race: one(racesTable, {
      fields: [predictionsTable.raceId],
      references: [racesTable.id],
    }),
  }),
)

export const predictionEntriesTable = sqliteTable(
  'prediction_entries',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    predictionId: text('prediction_id')
      .notNull()
      .references(() => predictionsTable.id, { onDelete: 'cascade' }),
    position: text({ enum: PREDICTION_FIELDS }).notNull(),
    driverId: text('driver_id').references(() => driversTable.id, {
      onDelete: 'cascade',
    }),
    constructorId: text('constructor_id').references(
      () => constructorsTable.id,
      {
        onDelete: 'cascade',
      },
    ),
    overwriteTo: text({ enum: TIP_OVERWRITE_OPTIONS }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    uniquePredictionPosition: unique().on(table.predictionId, table.position),
  }),
)

export const predictionEntriesRelations = relations(
  predictionEntriesTable,
  ({ many, one }) => ({
    prediction: one(predictionsTable, {
      fields: [predictionEntriesTable.predictionId],
      references: [predictionsTable.id],
    }),
    driver: one(driversTable, {
      fields: [predictionEntriesTable.driverId],
      references: [driversTable.id],
    }),
    constructor: one(constructorsTable, {
      fields: [predictionEntriesTable.constructorId],
      references: [constructorsTable.id],
    }),
  }),
)

export const resultsTable = sqliteTable('results', {
  id: text('id').primaryKey().$defaultFn(createId),
  /**
   * The id of the circut the race is held at
   */
  raceId: text()
    .notNull()
    .references(() => racesTable.id, { onDelete: 'cascade' }),
  addedAt: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer({ mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  driverId: text().references(() => driversTable.id, { onDelete: 'cascade' }),
  constructorId: text()
    .references(() => constructorsTable.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  /**
   * The driver's position in the sprint
   */
  sprint: integer(),
  /**
   * The driver's grid (qualifying) position
   */
  grid: integer(),
  /**
   * Finishing position of the driver. Empty if the driver failed to finish.
   */
  position: integer(),
  /**
   * Points the driver earned for this result
   */
  points: integer().notNull(),
  /**
   * The drivers finishing status in long form
   */
  status: text().notNull(),
})

export const resultsRelations = relations(resultsTable, ({ many, one }) => ({
  race: one(racesTable, {
    fields: [resultsTable.raceId],
    references: [racesTable.id],
  }),
  driver: one(driversTable, {
    fields: [resultsTable.driverId],
    references: [driversTable.id],
  }),
  constructor: one(constructorsTable, {
    fields: [resultsTable.constructorId],
    references: [constructorsTable.id],
  }),
}))

export type Group = typeof groupsTable.$inferSelect
export type GroupId = Group['id']

export type GroupMember = typeof groupMembersTable.$inferSelect

export type Race = typeof racesTable.$inferSelect
export type RaceId = Race['id']
export type InsertRace = typeof racesTable.$inferInsert

export type Driver = typeof driversTable.$inferSelect
export type InsertDriver = typeof driversTable.$inferInsert

export type Constructor = typeof constructorsTable.$inferSelect

export type Prediction = typeof predictionsTable.$inferSelect
export type PredictionId = Prediction['id']
export type InsertPrediction = typeof predictionsTable.$inferInsert

export type PredictionEntry = typeof predictionEntriesTable.$inferSelect
export type PredictionEntryId = PredictionEntry['id']
export type InsertPredictionEntry = typeof predictionEntriesTable.$inferInsert

export type Result = typeof resultsTable.$inferSelect
export type InsertResult = typeof resultsTable.$inferInsert

export type User = typeof user.$inferSelect
export type UserId = User['id']
