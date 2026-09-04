import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// cafe_settings_v2 는 행이 하나뿐이고 요일·시간이 시드값(주일 10:00~14:30)으로 고정돼 있다.
// 오늘이 그 요일이 아니면 게스트 주문 흐름 자체가 마감 배너에서 막혀 E2E 가 통과할 수 없으므로,
// 실행 전 오늘 요일 전체를 여는 창으로 넓히고, 끝나면 시드값으로 되돌려 npm run test:db 의 시드 단언을 지킨다.
const RESTORE = { weekday: 7, opens_at: '10:00', closes_at: '14:30' }

export default async function globalSetup() {
  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } })

  const { data: status, error: statusError } = await anon.rpc('cafe_status')
  if (statusError) throw statusError

  const { error: updateError } = await db
    .from('cafe_settings_v2')
    .update({ weekday: status.today_isodow, opens_at: '00:00', closes_at: '23:59' })
    .eq('id', true)
  if (updateError) throw updateError

  return async function globalTeardown() {
    await db.from('cafe_settings_v2').update(RESTORE).eq('id', true)
  }
}
