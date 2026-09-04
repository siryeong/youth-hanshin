import { afterEach, beforeEach, expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

const MINE = '22222222-2222-2222-2222-222222222222'
const OTHER = '33333333-3333-3333-3333-333333333333'

async function open() {
  const { data } = await anonClient().rpc('cafe_status')
  await serviceClient().from('cafe_settings_v2')
    .update({ weekday: data.today_isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  await serviceClient().from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
}

async function order(token: string) {
  const { data: menu } = await serviceClient().from('menus_v2').select('id').eq('name', '카페라떼').single()
  await anonClient().rpc('place_order', {
    p_items: [{ menu_id: menu!.id, option_label: 'ICE', options: {}, quantity: 1 }],
    p_guest_token: token,
  })
}

beforeEach(open)
afterEach(async () => {
  // 이 파일은 공유 설정 행을 바꾼다. 원래 값으로 되돌려야 뒤에 도는 schema.test.ts 의 시드 단언이 깨지지 않는다.
  const db = serviceClient()
  await db.from('cafe_settings_v2').update({ weekday: 7, opens_at: '10:00', closes_at: '14:30' }).eq('id', true)
  await db.from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})


test('자기 토큰의 오늘 주문만 본다', async () => {
  await order(MINE)
  await order(OTHER)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  expect(data).toHaveLength(1)
  expect(data![0].menu_name).toBe('카페라떼')
})

test('남의 항목은 취소하지 못한다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  const { error } = await anonClient().rpc('cancel_order_item', {
    p_item_id: data![0].item_id,
    p_guest_token: OTHER,
  })
  expect(error?.message).toContain('NOT_YOUR_ORDER')
})

test('자기 항목은 취소되고 상태가 바뀐다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  const { error } = await anonClient().rpc('cancel_order_item', {
    p_item_id: data![0].item_id,
    p_guest_token: MINE,
  })
  expect(error).toBeNull()
  const { data: after } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  expect(after![0].status).toBe('cancelled')
})

test('마감 뒤에는 취소하지 못한다', async () => {
  await order(MINE)
  const { data } = await anonClient().rpc('get_guest_orders', { p_guest_token: MINE })
  await serviceClient().from('cafe_settings_v2').update({ opens_at: '00:00', closes_at: '00:01' }).eq('id', true)
  const { error } = await anonClient().rpc('cancel_order_item', {
    p_item_id: data![0].item_id,
    p_guest_token: MINE,
  })
  expect(error?.message).toContain('ORDER_WINDOW_CLOSED')
})
