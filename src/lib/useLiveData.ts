import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/useAuth'
import { supabase } from './supabase'

export function useLiveData() {
  const client = useQueryClient()
  const { profile } = useAuth()
  useEffect(() => {
    for (const key of ['operations', 'announcements', 'orders', 'village']) void client.invalidateQueries({ queryKey: [key] })
  }, [client, profile?.village_revision])
  useEffect(() => {
    const refresh = () => {
      for (const key of ['menus', 'cafe-status', 'operations']) void client.invalidateQueries({ queryKey: [key] })
    }
    const channel = supabase.channel('cafe-changes').on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'cafe_revision_v2',
    }, refresh).subscribe((status) => { if (status === 'SUBSCRIBED') refresh() })
    return () => { void supabase.removeChannel(channel) }
  }, [client])
}
