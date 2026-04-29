'use client'

import { authClient } from '@/lib/auth-client'
import { LoginData, LoginForm } from '../../_components/login-form'
import { getPlaceholder } from '../../_lib/placeholder'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { enableNotificationsIfUnset } from '@/actions/enable-notifications-if-unset'

export default function MobileLoginForm() {
  const router = useRouter()
  return (
    <>
      <LoginForm
        title='Login to continue'
        description='Enter your account details to continue to the app'
        onLogin={onLogin}
        placeholder={getPlaceholder()}
      />
    </>
  )

  async function onLogin(value: LoginData) {
    const signInContext = await authClient.signIn.email({
      email: value.email,
      password: value.password,
    })
    if (signInContext.error) {
      if (signInContext.error.status === 401) {
        toast.error('Invalid Credentials')
        return
      }
      toast.error('Something went wrong', {
        description: signInContext.error.message,
      })
      console.error(signInContext.error)
      return
    }

    await enableNotificationsIfUnset()

    const url = `gridtip://auth/set-token/${signInContext.data.token}`
    router.push(url)
  }
}
