import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema/schema'
import * as authSchema from './schema/auth-schema'
import { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { getTableColumns, SQL, sql } from 'drizzle-orm'

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  casing: 'snake_case',
  schema: {
    ...schema,
    ...authSchema,
  },
})

/**
 * @link https://github.com/drizzle-team/drizzle-orm/issues/1728#issuecomment-2148635569
 */
export function conflictUpdateAllExcept<
  T extends SQLiteTable,
  E extends (keyof T['$inferInsert'])[],
>(table: T, except: E) {
  const columns = getTableColumns(table)
  const updateColumns = Object.entries(columns).filter(
    ([col]) => !except.includes(col as keyof typeof table.$inferInsert),
  )

  return updateColumns.reduce(
    (acc, [colName, table]) => ({
      ...acc,
      [colName]: sql.raw(`excluded.${table.name}`),
    }),
    {},
  ) as Omit<Record<keyof typeof table.$inferInsert, SQL>, E[number]>
}
