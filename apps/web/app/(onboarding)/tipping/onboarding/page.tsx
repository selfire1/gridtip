import { Metadata } from 'next'
import OnboardingClient from './_components/onboarding-client'
import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { Path } from '@/lib/utils/path'
import { getGroupsForUser } from '@/lib/utils/groups'
import { db } from '@/db'
import { user as userTable } from '@/db/schema/auth-schema'
import { eq } from 'drizzle-orm/sql'
import { OnboardingProvider } from './_lib/onboarding-context'

export const metadata: Metadata = {
  title: 'Welcome',
}

export default async function OnboardingPage() {
  const { user } = await verifySession()
  if (user.hasSeenOnboarding) {
    redirect(Path.Dashboard)
  }
  const userGroups = await getGroupsForUser(user.id)
  if (userGroups.length > 0) {
    await db
      .update(userTable)
      .set({ hasSeenOnboarding: true })
      .where(eq(userTable.id, user.id))
    redirect(Path.Dashboard)
  }
  return (
    <OnboardingProvider user={user}>
      <OnboardingClient />
    </OnboardingProvider>
  )
}
