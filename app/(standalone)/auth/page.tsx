import { LoginForm } from '@/components/login-form'
import { AppHeader } from '@/components/app-header'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log in or Sign up',
}

export default function AuthPage() {
  return <LoginForm />
}
