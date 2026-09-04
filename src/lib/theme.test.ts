import { beforeEach, expect, test } from 'vitest'
import { applyTheme, initTheme, readTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

test('기본값은 system 이고 속성을 남기지 않는다', () => {
  expect(readTheme()).toBe('system')
  applyTheme('system')
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
})

test('고른 테마를 속성과 로컬 저장소에 남긴다', () => {
  applyTheme('dark')
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  expect(readTheme()).toBe('dark')
})

test('재방문 시 저장된 테마를 복원한다', () => {
  localStorage.setItem('yh.theme', 'light')
  initTheme()
  expect(document.documentElement.getAttribute('data-theme')).toBe('light')
})

test('저장소가 막혀 있어도 던지지 않고 system 으로 물러선다', () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError')
  })
  try {
    expect(readTheme()).toBe('system')
  } finally {
    spy.mockRestore()
  }
})
