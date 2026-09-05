import { expect, test } from 'vitest'
import { ageOn, demographics, sortMembers, summarizeOrders } from './model'
import type { CafeOrder, RosterMember } from './api'

test('나이·평균은 미입력을 제외하고 주문은 옵션·마을별로 취소를 제외해 합산한다', () => {
  expect(ageOn('2000-09-06', '2026-09-05')).toBe(25)
  expect(ageOn('2000-09-06', '2026-09-06')).toBe(26)
  expect(ageOn('2000-02-29', '2025-02-28')).toBe(24)
  expect(ageOn(null, '2026-09-06')).toBeNull()
  const members = [{ name: '가', gender: 'male', birth_date: '2000-09-06' }, { name: '나', gender: null, birth_date: null }, { name: '다', gender: 'female', birth_date: '2002-09-06' }] as RosterMember[]
  expect(demographics(members, '2026-09-06')).toEqual({ male: 1, female: 1, unknown: 1, average: '25.0' })
  expect(sortMembers(members, 'age').map((member) => member.name)).toEqual(['가', '다', '나'])
  const order = { village_id: 'a', village_name: '사랑', menu_name: '라떼', options: { temperature: 'ice', shot: 1, light: false, syrup: false }, quantity: 2, status: 'ordered' } as CafeOrder
  const reversed = { syrup: false, light: false, shot: 1, temperature: 'ice' as const }
  expect(summarizeOrders([order, { ...order, options: reversed, quantity: 3 }, { ...order, quantity: 9, status: 'cancelled' }, { ...order, village_id: 'b' }]).map((group) => group.quantity)).toEqual([5, 2])
})
