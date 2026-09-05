import { act, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '../features/auth/useAuth'
import type { Profile } from '../features/auth/api'
import { useLiveData } from './useLiveData'

const realtime = vi.hoisted(() => ({ changed: null as (() => void) | null, remove: vi.fn() }))
vi.mock('./supabase', () => ({ supabase: {
  channel: () => ({ on: (_event: string, filter: { table: string }, changed: () => void) => {
    expect(filter.table).toBe('cafe_revision_v2')
    realtime.changed = changed
    return { subscribe: () => ({}) }
  } }), removeChannel: realtime.remove,
} }))

function Probe() { useLiveData(); return null }

test('카페 이벤트와 본인 변경 번호는 관련 캐시를 무효화하고 구독을 정리한다', () => {
  const client = new QueryClient()
  const keys = ['operations', 'announcements', 'orders', 'village', 'menus', 'cafe-status']
  const profile = { id: 'test-user', role: 'staff', village_revision: 0 } as Profile
  const view = (revision: number) => <QueryClientProvider client={client}><AuthContext value={{ profile: { ...profile, village_revision: revision }, refreshProfile: async () => {} }}><Probe /></AuthContext></QueryClientProvider>
  const rendered = render(view(0))
  keys.forEach((key) => client.setQueryData([key], 'cached'))
  act(() => realtime.changed!())
  for (const key of ['operations', 'menus', 'cafe-status']) expect(client.getQueryState([key])?.isInvalidated).toBe(true)
  keys.forEach((key) => client.setQueryData([key], 'cached'))
  rendered.rerender(view(1))
  for (const key of ['operations', 'announcements', 'orders', 'village']) expect(client.getQueryState([key])?.isInvalidated).toBe(true)
  rendered.unmount()
  expect(realtime.remove).toHaveBeenCalledOnce()
  client.clear()
})
