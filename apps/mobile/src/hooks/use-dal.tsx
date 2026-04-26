import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { useState, useTransition } from 'react'

const BEARER_KEY = 'bearer-token'

export type Session = {
  token: string
}

export type MaybeSession = Session | null | undefined

export function useDal() {
  const [isPending, setIsPending] = useState(true)
  const [session, setSession] = useState<MaybeSession>(null)
  SecureStore.getItemAsync(BEARER_KEY)
    .then((token) => setSession(token ? { token } : null))
    .finally(() => setIsPending(false))

  return {
    session,
    isPending,
    signIn,
  }

  async function signIn(token: string) {
    await SecureStore.setItemAsync(BEARER_KEY, token)
    setSession({ token })
  }
}
