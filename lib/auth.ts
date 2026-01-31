import { betterAuth } from 'better-auth'
import { hoursToSeconds } from 'date-fns'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendOnSignIn: true,
    async sendVerificationEmail({ user, url }) {
      const { error } = await resend.emails.send({
        from: 'GridTip <gridtip@noreply.joschua.io>',
        to: [user.email],
        subject: 'Verify email',
        html: `
<h1>Welcome to <strong>GridTip</strong>, ${user.name}</h1>

Click this link below to verify your email: <a href="${url}">${url}</a>`.trim(),
      })

      if (error) {
        console.error(error)
        throw new Error(error.message)
      }
    },
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
    additionalFields: {
      hasSeenOnboarding: {
        type: 'boolean',
        initialValue: false,
        defaultValue: false,
      },
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
