import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { CartLine } from './api'
import { useCartState } from './useCart'

const line = (menuId: string, quantity: number, label: string): CartLine => ({
  menu_id: menuId,
  menu_name: '아메리카노',
  option_label: label,
  options: { temperature: 'ice', shot: 0, light: false, syrup: false },
  quantity,
})

test('같은 메뉴를 옵션만 바꿔 담으면 수량을 합쳐 센다', () => {
  // 메뉴 카드의 배지는 줄 수가 아니라 수량 합계를 보여야 한다
  const { result } = renderHook(() => useCartState())
  act(() => result.current.add(line('m1', 2, 'ICE · 2잔')))
  act(() => result.current.add(line('m1', 3, 'HOT · 3잔')))

  expect(result.current.lines).toHaveLength(2)
  expect(result.current.counts).toEqual({ m1: 5 })
  expect(result.current.total).toBe(5)
})

test('항목을 삭제하면 줄과 합계가 모두 사라진다', () => {
  const { result } = renderHook(() => useCartState())
  act(() => result.current.add(line('m1', 1, 'ICE · 1잔')))
  act(() => result.current.remove(0))

  expect(result.current.lines).toHaveLength(0)
  expect(result.current.counts).toEqual({})
  expect(result.current.total).toBe(0)
})

test('수량 변경은 옵션 문구와 합계에 반영되고 범위 밖 값은 무시한다', () => {
  const { result } = renderHook(() => useCartState())
  act(() => result.current.add(line('m1', 1, 'ICE · 1잔')))
  act(() => result.current.setQuantity(0, 3))
  expect(result.current.lines[0].option_label).toBe('ICE · 3잔')
  expect(result.current.total).toBe(3)
  act(() => result.current.setQuantity(0, 0))
  expect(result.current.total).toBe(3)
})
