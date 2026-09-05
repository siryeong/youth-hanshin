import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'
import { signOut, syncProfile, type Profile } from './api'

const auth = vi.hoisted(() => ({
  listener: null as ((event: AuthChangeEvent, session: Session | null) => void) | null,
  changed: null as (() => void) | null,
  unsubscribe: vi.fn(),
}))
vi.mock('../../lib/supabase', () => ({ supabase: {
  auth: { onAuthStateChange: (listener: typeof auth.listener) => {
    auth.listener = listener
    return { data: { subscription: { unsubscribe: auth.unsubscribe } } }
  } },
  channel: () => ({ on: (_event: string, _filter: unknown, callback: () => void) => {
    auth.changed = callback
    return { subscribe: () => ({}) }
  } }),
  removeChannel: vi.fn(),
} }))
vi.mock('./api', () => ({ syncProfile: vi.fn(), signOut: vi.fn() }))

const profile: Profile = { id: 'first', name: '첫 사용자', role: 'youth', gender: null, birth_date: null, phone: null,
  show_gender: false, show_birth_date: false, show_phone: false, last_seen_at: null }

function Probe() {
  const { profile } = useAuth()
  return <p>{profile ? `${profile.name} ${profile.role}` : '게스트'}</p>
}

function renderAuth() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>)
}

const session = (id: string) => ({ user: { id, last_sign_in_at: '2026-09-06T00:00:00Z' } }) as Session

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(syncProfile).mockReset().mockResolvedValue(profile)
})

test('초기 세션을 기다리고 프로필·역할 갱신 후 로그아웃을 반영한다', async () => {
  const view = renderAuth()
  expect(screen.queryByText('게스트')).not.toBeInTheDocument()
  act(() => auth.listener!('INITIAL_SESSION', null))
  expect(screen.getByText('게스트')).toBeInTheDocument()
  act(() => auth.listener!('SIGNED_IN', session('first')))
  expect(await screen.findByText('첫 사용자 youth')).toBeInTheDocument()
  vi.mocked(syncProfile).mockResolvedValue({ ...profile, role: 'staff' })
  act(() => auth.changed!())
  expect(await screen.findByText('첫 사용자 staff')).toBeInTheDocument()
  act(() => auth.listener!('SIGNED_OUT', null))
  expect(screen.getByText('게스트')).toBeInTheDocument()
  view.unmount()
  expect(auth.unsubscribe).toHaveBeenCalledOnce()
})

test('프로필 실패를 게스트로 취급하지 않고 재시도와 로그아웃 오류를 보여준다', async () => {
  vi.mocked(syncProfile).mockRejectedValueOnce(new Error('offline'))
  vi.mocked(signOut).mockRejectedValueOnce(new Error('offline'))
  renderAuth()
  act(() => auth.listener!('INITIAL_SESSION', session('first')))
  await screen.findByRole('button', { name: '내 정보 다시 불러오기' })
  expect(screen.queryByText('게스트')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  expect(await screen.findByText('로그아웃하지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '내 정보 다시 불러오기' }))
  expect(await screen.findByText('첫 사용자 youth')).toBeInTheDocument()
})

test('계정 전환 후 늦게 도착한 이전 프로필 응답을 표시하지 않는다', async () => {
  let finish!: (value: Profile) => void
  vi.mocked(syncProfile).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
  renderAuth()
  act(() => auth.listener!('INITIAL_SESSION', session('first')))
  await waitFor(() => expect(syncProfile).toHaveBeenCalledOnce())
  vi.mocked(syncProfile).mockResolvedValue({ ...profile, id: 'second', name: '두 번째 사용자' })
  act(() => auth.listener!('SIGNED_IN', session('second')))
  expect(await screen.findByText('두 번째 사용자 youth')).toBeInTheDocument()
  await act(async () => finish(profile))
  expect(screen.queryByText('첫 사용자 youth')).not.toBeInTheDocument()
  expect(screen.getByText('두 번째 사용자 youth')).toBeInTheDocument()
})
