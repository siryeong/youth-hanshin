import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useOrderRealtime(onChange: () => void): void {
  useEffect(() => {
    const channel = supabase
      .channel('order-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items_v2' }, () => onChange())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [onChange])
}
