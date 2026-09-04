import { fireEvent, render, screen } from '@testing-library/react'
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

test('시트 안에서 시작한 조작이 배경에서 끝나도 닫히지 않는다', () => {
  // click 의 target 은 pointerdown 과 pointerup 의 공통 조상이다. 스테퍼를 드래그하다
  // 손을 배경에서 떼면 target 이 배경이 되어, 고르던 옵션이 통째로 날아갈 수 있다.
  const onClose = vi.fn()
  const { container } = render(<OptionSheet menu={menu} onClose={onClose} onAdd={() => {}} />)
  fireEvent.pointerDown(screen.getByRole('dialog'))
  fireEvent.click(container.firstChild as HTMLElement)
  expect(onClose).not.toHaveBeenCalled()
})

test('배경을 눌렀다 떼면 닫는다', () => {
  const onClose = vi.fn()
  const { container } = render(<OptionSheet menu={menu} onClose={onClose} onAdd={() => {}} />)
  const backdrop = container.firstChild as HTMLElement
  fireEvent.pointerDown(backdrop)
  fireEvent.click(backdrop)
  expect(onClose).toHaveBeenCalledOnce()
})

test('닫기 버튼과 Escape 로 닫는다', async () => {
  const onClose = vi.fn()
  render(<OptionSheet menu={menu} onClose={onClose} onAdd={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: '닫기' }))
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(2)
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
