import { useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { signOut, syncProfile } from './api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>()
  const [logoutError, setLogoutError] = useState(false)
  const client = useQueryClient()
  const userId = user?.id
  const profile = useQuery({
    queryKey: ['profile', user?.id, user?.last_sign_in_at],
    queryFn: syncProfile,
    enabled: !!user,
    gcTime: 0,
    staleTime: 0,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel(`profile:${userId}`).on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'profiles_v2', filter: `id=eq.${userId}`,
    }, () => { void client.invalidateQueries({ queryKey: ['profile', userId] }) }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [client, userId])

  if (user === undefined || (user && profile.isPending)) return <p role="status">로그인 정보를 확인하고 있어요</p>
  if (user && profile.isError) return (
    <div role="alert">
      내 정보를 불러오지 못했어요.
      <Button onClick={() => void profile.refetch()}>내 정보 다시 불러오기</Button>
      <Button variant="secondary" onClick={() => {
        setLogoutError(false)
        void signOut().catch(() => setLogoutError(true))
      }}>로그아웃</Button>
      {logoutError && <p>로그아웃하지 못했어요. 다시 시도해 주세요.</p>}
    </div>
  )

  return <AuthContext value={{
    profile: user ? profile.data! : null,
    refreshProfile: () => client.invalidateQueries({ queryKey: ['profile', userId] }),
  }}>{children}</AuthContext>
}
