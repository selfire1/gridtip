import { getTableColumns, SQL, sql } from 'drizzle-orm'
import { SQLiteTable } from 'drizzle-orm/sqlite-core'

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
