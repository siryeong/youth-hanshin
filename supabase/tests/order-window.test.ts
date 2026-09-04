import { afterEach, beforeEach, expect, test } from 'vitest'
import { anonClient, serviceClient } from './client'

async function todayIsodow(): Promise<number> {
  const { data } = await anonClient().rpc('cafe_status')
  return data.today_isodow
}

beforeEach(async () => {
  await serviceClient().from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})
afterEach(async () => {
  // 이 파일은 공유 설정 행을 바꾼다. 원래 값으로 되돌려야 뒤에 도는 schema.test.ts 의 시드 단언이 깨지지 않는다.
  const db = serviceClient()
  await db.from('cafe_settings_v2').update({ weekday: 7, opens_at: '10:00', closes_at: '14:30' }).eq('id', true)
  await db.from('cafe_closures_v2').delete().gte('closed_on', '1900-01-01')
})


test('설정된 요일과 시간 안이면 열려 있다', async () => {
  const isodow = await todayIsodow()
  await serviceClient().from('cafe_settings_v2').update({ weekday: isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  const { data } = await anonClient().rpc('cafe_status')
  expect(data.is_open).toBe(true)
})

test('다른 요일이면 닫혀 있다', async () => {
  const isodow = await todayIsodow()
  const other = isodow === 7 ? 1 : isodow + 1
  await serviceClient().from('cafe_settings_v2').update({ weekday: other, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  const { data } = await anonClient().rpc('cafe_status')
  expect(data.is_open).toBe(false)
  // 요일 때문에 닫힌 것이지 휴무일 때문이 아니다
  expect(data.is_closed_today).toBe(false)
  // 닫혀 있으면 남은 시간은 0 이어야 한다
  expect(data.closes_in_seconds).toBe(0)
})

test('임시 휴무일이면 시간 안이어도 닫혀 있다', async () => {
  const isodow = await todayIsodow()
  await serviceClient().from('cafe_settings_v2').update({ weekday: isodow, opens_at: '00:00', closes_at: '23:59' }).eq('id', true)
  const { data: status } = await anonClient().rpc('cafe_status')
  await serviceClient().from('cafe_closures_v2').insert({ closed_on: String(status.server_time).slice(0, 10), reason: '수련회' })
  const { data } = await anonClient().rpc('cafe_status')
  expect(data.is_open).toBe(false)
  expect(data.is_closed_today).toBe(true)
})
