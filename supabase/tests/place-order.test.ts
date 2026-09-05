import { afterEach, beforeEach, expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

const TOKEN = '11111111-1111-1111-1111-111111111111'

async function open() {
  const anon = anonClient()
  const { data } = await anon.rpc('cafe_status')
  await serviceClient().from('cafe_settings_v2')
    .update({ weekday: data.today_isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  await serviceClient().from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
}

async function americano(): Promise<string> {
  const { data } = await serviceClient().from('menus_v2').select('id').eq('name', '아메리카노').single()
  return data!.id
}

beforeEach(open)
afterEach(async () => {
  // 이 파일은 공유 설정 행을 바꾼다. 원래 값으로 되돌려야 뒤에 도는 schema.test.ts 의 시드 단언이 깨지지 않는다.
  const db = serviceClient()
  await db.from('cafe_settings_v2').update({ weekday: 7, opens_at: '10:00', closes_at: '14:30' }).eq('id', true)
  await db.from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})


test('열려 있으면 주문과 항목이 만들어지고 메뉴명이 스냅샷으로 남는다', async () => {
  const menuId = await americano()
  const { data: orderId, error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menuId, option_label: 'ICE · 샷 1', options: { temperature: 'ice', shot: 1, light: false, syrup: false }, quantity: 2 }],
    p_guest_token: TOKEN,
  })
  expect(error).toBeNull()

  const { data: items } = await serviceClient().from('order_items_v2').select('*').eq('order_id', orderId)
  expect(items).toHaveLength(1)
  expect(items![0].menu_name).toBe('아메리카노')
  expect(items![0].option_label).toBe('ICE · 샷 1 · 2잔')
  expect(items![0].quantity).toBe(2)
  expect(items![0].status).toBe('ordered')
})

test('마감 뒤에는 주문하지 못한다', async () => {
  const menuId = await americano()
  await serviceClient().from('cafe_settings_v2').update({ opens_at: '00:00', closes_at: '00:01' }).eq('id', true)
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menuId, option_label: 'ICE', options: {}, quantity: 1 }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('ORDER_WINDOW_CLOSED')
})

test('게스트 토큰이 없으면 거절한다', async () => {
  const menuId = await americano()
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menuId, option_label: 'ICE', options: {}, quantity: 1 }],
  })
  expect(error?.message).toContain('GUEST_TOKEN_REQUIRED')
})

test('빈 장바구니는 거절한다', async () => {
  const { error } = await anonClient().rpc('place_order', { p_items: [], p_guest_token: TOKEN })
  expect(error?.message).toContain('EMPTY_CART')
})

test('없는 메뉴를 담으면 거절한다', async () => {
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: '00000000-0000-0000-0000-000000000000', option_label: 'ICE', options: {}, quantity: 1 }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('MENU_NOT_FOUND')
})

test('숨긴 메뉴는 주문하지 못한다', async () => {
  const db = serviceClient()
  const { data: hidden } = await db
    .from('menus_v2')
    .insert({
      category: 'coffee',
      name: '숨긴 메뉴',
      price: 2000,
      ice_price_delta: 1000,
      options: { temperature: ['hot'], shot: 0, light: false, syrup: false },
      sort_order: 98,
      is_active: false,
    })
    .select('id')
    .single()

  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: hidden!.id, option_label: 'HOT', options: {}, quantity: 1 }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('MENU_NOT_FOUND')

  await db.from('menus_v2').delete().eq('id', hidden!.id)
})

test.each([0, 10, 1.5, null, '2'])('잘못된 수량 %s는 거절한다', async (quantity) => {
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: await americano(), options: { temperature: 'ice', shot: 0, light: false, syrup: false }, quantity }],
    p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('INVALID_QUANTITY')
})

test.each([
  null,
  {},
  { temperature: 'ice', shot: '1', light: false, syrup: false },
  { temperature: 'ice', shot: 0.5, light: false, syrup: false },
  { temperature: 'ice', shot: 3, light: false, syrup: false },
  { temperature: 'ice', shot: -1, light: false, syrup: false },
  { temperature: 'warm', shot: 0, light: false, syrup: false },
  { temperature: 'ice', shot: 0, light: 'false', syrup: false },
  { temperature: 'ice', shot: 0, light: false, syrup: false, unknown: true },
])('잘못된 옵션은 거절한다: %j', async (options) => {
  const { error } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: await americano(), options, quantity: 1 }], p_guest_token: TOKEN,
  })
  expect(error?.message).toContain('INVALID_OPTIONS')
})

test('ICE 전용 메뉴의 HOT·샷·연하게·시럽을 거절하고 주문 전체를 롤백한다', async () => {
  const db = serviceClient()
  const { data: cold } = await db.from('menus_v2').select('id').eq('name', '레몬 아이스티').single()
  const token = crypto.randomUUID()
  const base = { temperature: 'ice', shot: 0, light: false, syrup: false }
  for (const change of [{ temperature: 'hot' }, { shot: 1 }, { light: true }, { syrup: true }]) {
    const { error } = await anonClient().rpc('place_order', {
      p_items: [
        { menu_id: await americano(), options: base, quantity: 1 },
        { menu_id: cold!.id, options: { ...base, ...change }, quantity: 1 },
      ], p_guest_token: token,
    })
    expect(error?.message).toContain('INVALID_OPTIONS')
  }
  const { data, error } = await db.from('orders_v2').select('id').eq('guest_token', token)
  expect(error).toBeNull()
  expect(data).toEqual([])
})

test('메뉴를 지워도 주문 내역은 주문 당시 이름과 옵션으로 남는다', async () => {
  const db = serviceClient()
  const { data: temp } = await db
    .from('menus_v2')
    .insert({
      category: 'coffee',
      name: '한정 메뉴',
      price: 2000,
      ice_price_delta: 1000,
      options: { temperature: ['hot'], shot: 0, light: false, syrup: false },
      sort_order: 99,
    })
    .select('id')
    .single()

  const { data: orderId } = await anonClient().rpc('place_order', {
    p_items: [{ menu_id: temp!.id, option_label: 'HOT · 1잔', options: { temperature: 'hot', shot: 0, light: false, syrup: false }, quantity: 1 }],
    p_guest_token: TOKEN,
  })

  await db.from('menus_v2').delete().eq('id', temp!.id)

  const { data: items } = await db
    .from('order_items_v2')
    .select('menu_id, menu_name, option_label')
    .eq('order_id', orderId)

  expect(items![0].menu_id).toBeNull()
  expect(items![0].menu_name).toBe('한정 메뉴')
  expect(items![0].option_label).toBe('HOT · 1잔')
})
