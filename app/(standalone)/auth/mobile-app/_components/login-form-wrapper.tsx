'use client'

import { authClient } from '@/lib/auth-client'
import { LoginForm } from '../../_components/login-form'
import { getPlaceholder } from '../../_lib/placeholder'
import { toast } from 'sonner'

export default function MobileLoginForm() {
  return (
    <LoginForm
      title='Login to continue'
      description='Enter your account details to continue to the app'
      onLogin={async (value) => {
        const signInContext = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: '', // TODO: app
        })
        if (signInContext.error) {
          const isInvalidCredentialsError =
            signInContext.error.status === 403 ? 'unverified' : 'other'

          if (isInvalidCredentialsError) {
            toast.error('Invalid Credentials')
            return
          }
          toast.error('Something went wrong', {
            description: signInContext.error.message,
          })
          console.error(signInContext.error)
        }
      }}
      placeholder={getPlaceholder()}
    />
  )
}
