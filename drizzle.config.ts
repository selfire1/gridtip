import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env' })

export default defineConfig({
  schema: ['./db/schema/schema.ts', './db/schema/auth-schema.ts'],
  out: './db/migrations',
  dialect: 'turso',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
})
