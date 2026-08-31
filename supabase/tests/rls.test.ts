import { expect, test } from 'vitest'
import { anonClient } from './client'

test('게스트는 menus 테이블을 읽지 못한다', async () => {
  const { data } = await anonClient().from('menus_v2').select('id, price')
  expect(data ?? []).toHaveLength(0)
})

test('게스트는 menus_public 으로 메뉴를 읽고 가격 컬럼은 없다', async () => {
  const { data, error } = await anonClient().from('menus_public_v2').select('*')
  expect(error).toBeNull()
  expect(data!).toHaveLength(19)
  expect(Object.keys(data![0])).not.toContain('price')
  expect(Object.keys(data![0])).not.toContain('ice_price_delta')
})

test('게스트는 주문 테이블을 직접 읽지 못한다', async () => {
  const { data } = await anonClient().from('order_items_v2').select('id')
  expect(data ?? []).toHaveLength(0)
})
