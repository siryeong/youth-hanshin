import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { supabase } from '../../lib/supabase'
import { useOrderRealtime } from './useOrderRealtime'

test('order_items 변경을 구독하고 언마운트에서 해제한다', () => {
  const on = vi.fn().mockReturnThis()
  const subscribe = vi.fn().mockReturnThis()
  const channel = { on, subscribe } as never
  vi.spyOn(supabase, 'channel').mockReturnValue(channel)
  const removeChannel = vi.spyOn(supabase, 'removeChannel').mockResolvedValue('ok' as never)

  const onChange = vi.fn()
  const { unmount } = renderHook(() => useOrderRealtime(onChange))

  expect(on).toHaveBeenCalledWith(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'order_items_v2' },
    expect.any(Function),
  )
  unmount()
  expect(removeChannel).toHaveBeenCalledWith(channel)
})
