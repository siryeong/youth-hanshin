import { expect, test } from 'vitest'
import { serviceClient } from './client'

test('메뉴판 그대로 19개가 세 카테고리로 들어간다', async () => {
  const { data, error } = await serviceClient().from('menus_v2').select('category, name, price, ice_price_delta')
  expect(error).toBeNull()
  expect(data!).toHaveLength(19)
  expect(new Set(data!.map((m) => m.category))).toEqual(new Set(['coffee', 'non_coffee', 'cold']))
})

test('아메리카노는 1000원이고 ICE 는 1000원을 더 받는다', async () => {
  const { data } = await serviceClient().from('menus_v2').select('price, ice_price_delta').eq('name', '아메리카노').single()
  expect(data!.price).toBe(1000)
  expect(data!.ice_price_delta).toBe(1000)
})

test('COLD DRINKS 는 ICE 추가금이 없다', async () => {
  const { data } = await serviceClient().from('menus_v2').select('ice_price_delta').eq('category', 'cold')
  expect(data!.every((m) => m.ice_price_delta === 0)).toBe(true)
})

test('기본 주문 시간대는 주일 10:00-14:30 이다', async () => {
  const { data } = await serviceClient().from('cafe_settings_v2').select('*').single()
  expect(data!.weekday).toBe(7)
  expect(data!.opens_at).toBe('10:00:00')
  expect(data!.closes_at).toBe('14:30:00')
})
