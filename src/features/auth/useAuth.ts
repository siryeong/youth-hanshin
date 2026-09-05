import { createContext, useContext } from 'react'
import type { Profile } from './api'

export const AuthContext = createContext<{ profile: Profile | null; refreshProfile: () => Promise<void> } | null>(null)

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AuthProvider is required')
  return auth
}
