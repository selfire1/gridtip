import { use, createContext, useEffect, type PropsWithChildren } from 'react'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'

import { useStorageState } from '@/hooks/use-storage-state'
import { MaybeSession } from '@/hooks/use-dal'
import { setOnUnauthorized } from './api'

const AuthContext = createContext<{
  signIn: (token: string) => void
  signOut: () => void
  session?: MaybeSession
  isLoading: boolean
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
})

export function useSession() {
  const value = use(AuthContext)
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />')
  }

  return value
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, token], setToken] = useStorageState('session')
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    setOnUnauthorized(() => {
      setToken(null)
      queryClient.clear()
      router.replace('/auth/sign-in')
    })
    return () => {
      setOnUnauthorized(null)
    }
  }, [router, queryClient, setToken])

  return (
    <AuthContext.Provider
      value={{
        signIn: (token) => {
          setToken(token)
        },
        signOut: () => {
          setToken(null)
        },
        session: !token ? null : { token },
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
