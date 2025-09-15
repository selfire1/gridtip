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
