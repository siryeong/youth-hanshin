import { createClient } from '@supabase/supabase-js'

export function localSupabaseUrl() {
  const url = process.env.SUPABASE_URL
  if (!url || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) {
    throw new Error('DB reset/E2E tests require a local SUPABASE_URL')
  }
  return url
}

export const serviceClient = () =>
  createClient(localSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })

export const anonClient = () =>
  createClient(localSupabaseUrl(), process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
