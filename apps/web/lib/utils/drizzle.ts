import { getTableColumns, SQL, sql } from 'drizzle-orm'
import { SQLiteTable } from 'drizzle-orm/sqlite-core'

/**
 * @link https://github.com/drizzle-team/drizzle-orm/issues/1728#issuecomment-2148635569
 */
export function onConflictUpdateKeys<
  TTable extends SQLiteTable,
  TInclude extends (keyof TTable['$inferInsert'])[],
>(table: TTable, include: TInclude) {
  const columns = getTableColumns(table)
  const updateColumns = Object.entries(columns).filter(([col]) =>
    include.includes(col as keyof typeof table.$inferInsert),
  )

  return updateColumns.reduce(
    (acc, [colName, table]) => ({
      ...acc,
      [colName]: sql.raw(`excluded.${table.name}`),
    }),
    {},
  ) as Omit<Record<keyof typeof table.$inferInsert, SQL>, TInclude[number]>
}
