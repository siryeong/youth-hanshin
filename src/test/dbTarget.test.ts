import { localSupabaseUrl } from '../../supabase/tests/client'


test('데이터를 변경하는 DB 테스트는 원격 주소를 거절한다', () => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  try {
    expect(() => localSupabaseUrl()).toThrow('require a local SUPABASE_URL')
    vi.stubEnv('SUPABASE_URL', 'http://127.0.0.1:54321')
    expect(localSupabaseUrl()).toBe('http://127.0.0.1:54321')
  } finally {
    vi.unstubAllEnvs()
  }
})
