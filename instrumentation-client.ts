import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://54e3173ef1d7071e4f710c456ff88c04@o4510883461267456.ingest.de.sentry.io/4510883462447184',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  sendDefaultPii: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
})
