import { supabase } from '../../lib/supabase'

export type ProfileInput = {
  name: string
  gender: 'male' | 'female' | null
  birth_date: string | null
  phone: string | null
  show_gender: boolean
  show_birth_date: boolean
  show_phone: boolean
}

export type Profile = ProfileInput & {
  id: string
  role: 'admin' | 'pastor' | 'staff' | 'youth'
  last_seen_at: string | null
  village_revision: number
}

export const roleLabels: Record<Profile['role'], string> = {
  admin: '시스템 관리자', pastor: '목회자', staff: '임원', youth: '청년',
}

export async function syncProfile(): Promise<Profile> {
  const { data, error } = await supabase.rpc('sync_my_profile_v2')
  if (error) throw error
  return data as Profile
}

export async function updateProfile(id: string, input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase.from('profiles_v2').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}

export async function signIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: `${window.location.origin}/login`, scopes: 'profile_nickname profile_image' },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}
