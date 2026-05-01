'use client'

import { authClient } from '@/lib/auth-client'
import { LoginForm } from '../../_components/login-form'
import { getPlaceholder } from '../../_lib/placeholder'
import { Path } from '@/lib/utils/path'
import { toast } from 'sonner'

export default function LoginPageForm() {
  return (
    <LoginForm
      title='Login to your account'
      description='Enter your email below to login to your account'
      onLogin={async (value, redirect) => {
        const signInContext = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: redirect || Path.Dashboard,
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
        }
      }}
      placeholder={getPlaceholder()}
    />
  )
}
