import { beforeEach, expect, test } from 'vitest'
import { getGuestToken } from './guestToken'

beforeEach(() => localStorage.clear())

test('한 번 발급한 토큰을 계속 쓴다', () => {
  const first = getGuestToken()
  expect(getGuestToken()).toBe(first)
  expect(localStorage.getItem('yh.guestToken')).toBe(first)
})

test('UUID 형식이다', () => {
  expect(getGuestToken()).toMatch(/^[0-9a-f-]{36}$/)
})

test('저장소가 막혀 있어도 세션 동안 쓸 토큰을 준다', () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError')
  })
  try {
    const first = getGuestToken()
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(getGuestToken()).toBe(first)
  } finally {
    spy.mockRestore()
  }
})
