import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

test('현재 테마에 맞는 라벨로 렌더된다', () => {
  localStorage.setItem('yh.theme', 'dark')
  render(<ThemeToggle />)
  expect(screen.getByRole('button', { name: '밝은 테마로 바꾸기' })).toBeInTheDocument()
})

test('누르면 data-theme 을 바꾸고 라벨도 뒤집힌다', async () => {
  localStorage.setItem('yh.theme', 'light')
  render(<ThemeToggle />)

  await userEvent.click(screen.getByRole('button', { name: '어두운 테마로 바꾸기' }))

  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  expect(screen.getByRole('button', { name: '밝은 테마로 바꾸기' })).toBeInTheDocument()
})
