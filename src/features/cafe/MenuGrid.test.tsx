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
  // 진짜 보장은 menus_public_v2 뷰가 가격 컬럼을 주지 않는다는 것과 Menu 타입에
  // price 필드가 없다는 것이다. 이 단언은 누군가 "2,000원" 같은 문자열을 직접
  // 박아 넣는 경우만 잡는 얕은 그물이다. 숫자 자체는 가격의 증거가 아니므로
  // 세 자리 숫자로 검사하지 않는다 — 수량 배지가 커지면 엉뚱하게 실패한다.
  const { container } = render(<MenuGrid menus={menus} counts={{}} onPick={() => {}} />)
  expect(container.textContent).not.toMatch(/원|₩/)
})

test('메뉴를 누르면 onPick 에 그 메뉴를 넘긴다', async () => {
  const onPick = vi.fn()
  render(<MenuGrid menus={menus} counts={{}} onPick={onPick} />)
  await userEvent.click(screen.getByRole('button', { name: /아메리카노/ }))
  expect(onPick).toHaveBeenCalledWith(menus[0])
})
