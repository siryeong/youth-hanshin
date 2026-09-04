import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { CartLine } from './api'
import { useCart } from './useCart'

const line = (menuId: string, quantity: number, label: string): CartLine => ({
  menu_id: menuId,
  menu_name: '아메리카노',
  option_label: label,
  options: { temperature: 'ice', shot: 0, light: false, syrup: false },
  quantity,
})

test('같은 메뉴를 옵션만 바꿔 담으면 수량을 합쳐 센다', () => {
  // 메뉴 카드의 배지는 줄 수가 아니라 수량 합계를 보여야 한다
  const { result } = renderHook(() => useCart())
  act(() => result.current.add(line('m1', 2, 'ICE · 2잔')))
  act(() => result.current.add(line('m1', 3, 'HOT · 3잔')))

  expect(result.current.lines).toHaveLength(2)
  expect(result.current.counts).toEqual({ m1: 5 })
  expect(result.current.total).toBe(5)
})

test('비우면 줄과 합계가 모두 사라진다', () => {
  const { result } = renderHook(() => useCart())
  act(() => result.current.add(line('m1', 1, 'ICE · 1잔')))
  act(() => result.current.clear())

  expect(result.current.lines).toHaveLength(0)
  expect(result.current.counts).toEqual({})
  expect(result.current.total).toBe(0)
})
