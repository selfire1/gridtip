import { betterAuth } from 'better-auth'
import { hoursToSeconds } from 'date-fns'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: hoursToSeconds(24 * 7),
    updateAge: hoursToSeconds(24 * 1),
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
})
