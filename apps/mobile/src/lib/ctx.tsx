import { use, createContext, type PropsWithChildren } from 'react'

import { useStorageState } from '@/hooks/use-storage-state'
import { MaybeSession } from '@/hooks/use-dal'

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
