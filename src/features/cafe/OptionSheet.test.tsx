import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OptionSheet } from './OptionSheet'
import type { Menu } from './api'

const menu: Menu = {
  id: 'm1', category: 'coffee', name: '아메리카노', sort_order: 1,
  options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false },
}

test('메뉴가 쓰지 않는 옵션은 보여주지 않는다', () => {
  render(<OptionSheet menu={menu} onClose={() => {}} onAdd={() => {}} />)
  expect(screen.getByRole('button', { name: 'ICE' })).toBeInTheDocument()
  expect(screen.queryByText('시럽 추가')).not.toBeInTheDocument()
})

test('고른 옵션으로 장바구니 줄을 만든다', async () => {
  const onAdd = vi.fn()
  render(<OptionSheet menu={menu} onClose={() => {}} onAdd={onAdd} />)
  await userEvent.click(screen.getByRole('button', { name: 'HOT' }))
  await userEvent.click(screen.getByRole('button', { name: '수량 늘리기' }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))

  expect(onAdd).toHaveBeenCalledWith({
    menu_id: 'm1',
    menu_name: '아메리카노',
    option_label: 'HOT · 2잔',
    options: { temperature: 'hot', shot: 0, light: false, syrup: false },
    quantity: 2,
  })
})
