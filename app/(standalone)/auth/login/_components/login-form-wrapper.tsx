'use client'

import { authClient } from '@/lib/auth-client'
import { LoginForm } from '../../_components/login-form'
import { getPlaceholder } from '../../_lib/placeholder'
import { Path } from '@/lib/utils/path'
import { toast } from 'sonner'

export default function LoginPageForm() {
  return (
    <LoginForm
      onLogin={async (value, redirect) => {
        const signInContext = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: redirect || Path.Dashboard,
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
