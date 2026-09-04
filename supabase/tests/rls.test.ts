import { expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

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

test('게스트는 실제로 존재하는 주문도 직접 읽지 못한다', async () => {
  const db = serviceClient()
  const { data: order } = await db
    .from('orders_v2')
    .insert({ guest_token: '99999999-9999-9999-9999-999999999999', service_date: '2026-08-30' })
    .select('id')
    .single()
  await db.from('order_items_v2').insert({
    order_id: order!.id,
    menu_name: '아메리카노',
    option_label: 'ICE · 1잔',
    quantity: 1,
  })

  // 테이블이 비어서 0행인지, RLS 가 막아서 0행인지 구분하려면 실제 행이 있어야 한다
  const { data: real } = await db.from('order_items_v2').select('id').eq('order_id', order!.id)
  expect(real).toHaveLength(1)

  const { data: items } = await anonClient().from('order_items_v2').select('id')
  expect(items ?? []).toHaveLength(0)
  const { data: orders } = await anonClient().from('orders_v2').select('id')
  expect(orders ?? []).toHaveLength(0)

  await db.from('orders_v2').delete().eq('id', order!.id)
})

test('게스트는 menus_public_v2 를 지우지 못하고 메뉴는 그대로 남는다', async () => {
  const db = serviceClient()
  const before = await db.from('menus_v2').select('id', { count: 'exact', head: true })

  const { error } = await anonClient().from('menus_public_v2').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  expect(error).not.toBeNull()

  const after = await db.from('menus_v2').select('id', { count: 'exact', head: true })
  expect(after.count).toBe(before.count)
  expect(after.count).toBe(19)
})

test('게스트는 menus_public_v2 를 고치지 못하고 이름은 그대로 남는다', async () => {
  const db = serviceClient()
  const { data: before } = await db.from('menus_v2').select('id, name').eq('name', '아메리카노').single()

  const { error } = await anonClient()
    .from('menus_public_v2')
    .update({ name: '해킹됨' })
    .eq('id', before!.id)
  expect(error).not.toBeNull()

  const { data: after } = await db.from('menus_v2').select('name').eq('id', before!.id).single()
  expect(after!.name).toBe('아메리카노')
})

test('게스트는 orders_v2 에 직접 insert 하지 못한다', async () => {
  const { error } = await anonClient()
    .from('orders_v2')
    .insert({ guest_token: '11111111-1111-1111-1111-111111111111', service_date: '2026-08-30' })
  expect(error).not.toBeNull()
})
