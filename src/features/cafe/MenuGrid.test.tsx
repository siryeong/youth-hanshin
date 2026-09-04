import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuGrid } from './MenuGrid'
import type { Menu } from './api'

const menus: Menu[] = [
  { id: 'm1', category: 'coffee', name: '아메리카노', sort_order: 1, options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false } },
  { id: 'm2', category: 'coffee', name: '카페라떼', sort_order: 2, options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false } },
]

test('메뉴 이름과 담긴 수량을 보여준다', () => {
  render(<MenuGrid menus={menus} counts={{ m2: 2 }} onPick={() => {}} />)
  expect(screen.getByRole('button', { name: /아메리카노/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /카페라떼 2개 담김/ })).toBeInTheDocument()
})

test('가격을 화면에 내보내지 않는다', () => {
  const { container } = render(<MenuGrid menus={menus} counts={{}} onPick={() => {}} />)
  expect(container.textContent).not.toMatch(/원|\d{3,}/)
})

test('메뉴를 누르면 onPick 에 그 메뉴를 넘긴다', async () => {
  const onPick = vi.fn()
  render(<MenuGrid menus={menus} counts={{}} onPick={onPick} />)
  await userEvent.click(screen.getByRole('button', { name: /아메리카노/ }))
  expect(onPick).toHaveBeenCalledWith(menus[0])
})
