import { expect, test, type Page } from '@playwright/test'

const userId = 'f3000000-0000-4000-8000-000000000001'
const peerId = 'f3000000-0000-4000-8000-000000000002'

async function villageApp(page: Page, leader: boolean) {
  const state = {
    revision: 0, assigned: true, leader, failPrayer: true, failAttendance: true,
    name: '사랑마을',
    attendance: [] as { profile_id: string; service_date: string; worship: boolean; meeting: boolean }[],
    posts: [{ id: 'post-1', author_id: peerId, author_name: '김하늘', title: '이번 주 모임 안내', body: '예배 후 3층에서 만나요.', created_at: '2026-09-06T00:00:00Z' }],
    prayers: [{ id: 'prayer-1', author_id: peerId, author_name: '김하늘', body: '가족의 건강을 위해 기도해 주세요.', created_at: '2026-09-06T00:00:00Z' }],
    writes: [] as Record<string, unknown>[],
  }
  const expires = Math.floor(Date.now() / 1000) + 3600
  const payload = Buffer.from(JSON.stringify({ sub: userId, role: 'authenticated', exp: expires })).toString('base64url')
  await page.addInitScript(({ expires, payload, userId }) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify({
      access_token: `e30.${payload}.test-signature`, refresh_token: 'test-only-refresh', token_type: 'bearer', expires_at: expires,
      user: { id: userId, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-09-06T00:00:00Z' },
    }))
  }, { expires, payload, userId })
  await page.routeWebSocket(/.*/, (socket) => socket.close())
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === 'http://127.0.0.1:5178') return route.continue()
    if (url.origin !== 'http://127.0.0.1:54321') return route.abort()
    const endpoint = url.pathname.split('/').pop()
    const method = route.request().method()
    const input = method === 'POST' || method === 'PATCH' ? route.request().postDataJSON() : null
    const id = url.searchParams.get('id')?.replace('eq.', '')
    let body: unknown
    if (endpoint === 'sync_my_profile_v2') body = {
      id: userId, name: '이도현', role: 'youth', gender: null, birth_date: null, phone: null,
      show_gender: false, show_birth_date: false, show_phone: false, last_seen_at: null, village_revision: state.revision,
    }
    else if (endpoint === 'village_calendar_v2') body = { today: '2026-09-06', sunday: '2026-09-06', editable_from: '2026-08-16' }
    else if (endpoint === 'villages_v2' && method === 'GET') body = state.assigned ? [
      { id: 'village-1', name: state.name, cohort_id: 'cohort-1', cohorts_v2: { name: '3기', year: 2026, is_active: true } },
      { id: 'village-old', name: '지난 마을', cohort_id: 'cohort-old', cohorts_v2: { name: '2기', year: 2025, is_active: false } },
    ] : []
    else if (endpoint === 'villages_v2' && method === 'PATCH') { state.name = input.name; state.revision++; body = { id } }
    else if (endpoint === 'village_members_public_v2') body = state.assigned ? [
      { profile_id: userId, name: '이도현', is_leader: state.leader, gender: null, birth_date: null, phone: null },
      { profile_id: peerId, name: '김하늘', is_leader: true, gender: 'female', birth_date: '2000-02-29', phone: '01000000000' },
    ] : []
    else if (endpoint === 'attendance_v2') body = state.attendance.filter((row) => row.service_date === url.searchParams.get('service_date')?.replace('eq.', ''))
    else if (endpoint === 'set_village_attendance_v2') {
      if (state.failAttendance) {
        state.failAttendance = false
        return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"test offline"}' })
      }
      state.writes.push(input)
      let record = state.attendance.find((row) => row.profile_id === input.p_profile_id && row.service_date === input.p_service_date)
      if (!record) { record = { profile_id: input.p_profile_id, service_date: input.p_service_date, worship: false, meeting: false }; state.attendance.push(record) }
      record[input.p_kind as 'worship' | 'meeting'] = input.p_present
      state.revision++
      body = null
    }
    else if (endpoint === 'village_posts_public_v2') body = state.posts
    else if (endpoint === 'prayer_requests_public_v2') body = state.prayers
    else if (endpoint === 'village_order_stats_v2') body = [{ menu_name: '아메리카노', options: { temperature: 'ice', shot: 1, light: false, syrup: false }, quantity: 3 }]
    else if (endpoint === 'village_posts_v2') {
      state.writes.push(input ?? { id, method })
      if (method === 'POST') state.posts.push({ ...input, id: 'post-new', author_id: userId, author_name: '이도현', created_at: '2026-09-06T01:00:00Z' })
      if (method === 'PATCH') Object.assign(state.posts.find((post) => post.id === id)!, input)
      if (method === 'DELETE') state.posts = state.posts.filter((post) => post.id !== id)
      state.revision++
      body = { id: id ?? 'post-new' }
    }
    else if (endpoint === 'prayer_requests_v2') {
      if (state.failPrayer) {
        state.failPrayer = false
        return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"test offline"}' })
      }
      state.writes.push(input ?? { id, method })
      if (method === 'POST') state.prayers.push({ ...input, id: 'prayer-new', author_id: userId, author_name: '이도현', created_at: '2026-09-06T01:00:00Z' })
      if (method === 'PATCH') Object.assign(state.prayers.find((prayer) => prayer.id === id)!, input)
      if (method === 'DELETE') state.prayers = state.prayers.filter((prayer) => prayer.id !== id)
      state.revision++
      body = { id: id ?? 'prayer-new' }
    }
    else return route.abort()
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  return state
}

test('이장의 마을 관리·출석·소식·기도제목과 모바일·다크 화면', async ({ page }) => {
  const state = await villageApp(page, true)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/village')
  await expect(page.getByRole('heading', { name: '사랑마을', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '내 마을', exact: true })).toBeVisible()
  await expect(page.getByText('총 3잔')).toBeVisible()
  await expect(page.getByText('휴대폰 01000000000', { exact: true })).toHaveCount(0)
  await page.getByLabel('개인정보 마스킹 해제').check()
  await expect(page.getByText('휴대폰 01000000000', { exact: true })).toBeVisible()
  await page.getByLabel('개인정보 마스킹 해제').uncheck()
  await page.screenshot({ path: test.info().outputPath('village-mobile.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.getByRole('button', { name: '마을 이름 변경', exact: true }).click()
  await page.getByLabel('마을 이름', { exact: true }).fill('새 사랑마을')
  await page.getByRole('button', { name: '마을 이름 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '새 사랑마을', exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: '김하늘 예배', exact: true }).check()
  await expect(page.getByRole('alert')).toContainText('저장하지 못했어요. 이장 권한과 최근 4주 범위를')
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).not.toBeChecked()
  await page.getByRole('checkbox', { name: '김하늘 예배', exact: true }).check()
  await expect.poll(() => state.writes[state.writes.length - 1]).toMatchObject({ p_profile_id: peerId, p_kind: 'worship', p_present: true, p_service_date: '2026-09-06' })
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeEnabled()
  await page.getByRole('checkbox', { name: '김하늘 마을모임', exact: true }).check()
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '김하늘 마을모임', exact: true })).toBeChecked()

  await page.getByRole('button', { name: '기도제목 올리기', exact: true }).click()
  await page.getByLabel('기도제목 내용', { exact: true }).fill('진로를 위해 기도해 주세요.')
  await page.getByLabel('출석 기준 주일').fill('2026-08-16')
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeEnabled()
  await expect(page.getByLabel('기도제목 내용', { exact: true })).toHaveValue('진로를 위해 기도해 주세요.')
  await page.getByLabel('출석 기준 주일').fill('2026-08-09')
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeDisabled()
  await page.getByLabel('출석 기준 주일').fill('2026-09-06')
  await page.getByRole('button', { name: '기도제목 저장', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('입력한 내용은 유지돼요')
  await expect(page.getByLabel('기도제목 내용', { exact: true })).toHaveValue('진로를 위해 기도해 주세요.')
  await page.getByRole('button', { name: '기도제목 저장', exact: true }).click()
  await expect(page.getByText('진로를 위해 기도해 주세요.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '기도제목 수정: 진로를 위해 기도해 주세요.' }).click()
  await page.getByLabel('기도제목 내용', { exact: true }).fill('수정한 기도제목')
  await page.getByRole('button', { name: '기도제목 저장', exact: true }).click()
  await expect(page.getByText('수정한 기도제목', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '기도제목 삭제: 수정한 기도제목' }).click()
  await page.getByRole('button', { name: '삭제 확인', exact: true }).click()
  await expect(page.getByText('수정한 기도제목', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /기도제목 수정: 가족/ })).toHaveCount(0)

  await page.getByRole('button', { name: '마을 소식 올리기', exact: true }).click()
  await page.getByLabel('소식 제목', { exact: true }).fill('다음 주 안내')
  await page.getByLabel('마을 소식 내용', { exact: true }).fill('함께 식사해요.')
  await page.getByRole('button', { name: '마을 소식 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '다음 주 안내', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '마을 소식 수정: 다음 주 안내' }).click()
  await page.getByLabel('소식 제목', { exact: true }).fill('수정된 안내')
  await page.getByRole('button', { name: '마을 소식 저장', exact: true }).click()
  await page.getByRole('button', { name: '마을 소식 삭제: 수정된 안내' }).click()
  await page.getByRole('button', { name: '삭제 확인', exact: true }).click()
  await expect(page.getByRole('heading', { name: '수정된 안내', exact: true })).toHaveCount(0)

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: test.info().outputPath('village-desktop-dark.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByLabel('기수·마을').selectOption('village-old')
  await expect(page.getByText('지난 기수 기록은 조회만 할 수 있어요.')).toBeVisible()
  await expect(page.getByRole('button', { name: '마을 이름 변경', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '기도제목 올리기', exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeDisabled()
  await page.getByLabel('기수·마을').selectOption('village-1')
  state.leader = false
  state.revision++
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByRole('button', { name: '마을 이름 변경', exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeDisabled()
})

test('청년 조회 권한과 마을 이동·미배정 갱신', async ({ page }) => {
  const state = await villageApp(page, false)
  await page.goto('/village')
  await expect(page.getByRole('heading', { name: '사랑마을', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '마을 이름 변경', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '마을 소식 올리기', exact: true })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '마을 주문 통계', exact: true })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: '김하늘 예배', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '기도제목 올리기', exact: true })).toBeVisible()
  state.assigned = false
  state.revision++
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect(page.getByText(/현재 기수에 배정된 마을이 없어요/)).toBeVisible()
  await expect(page.getByText('가족의 건강을 위해 기도해 주세요.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '사랑마을', exact: true })).toHaveCount(0)
})

test('게스트는 마을 화면에서 로그인으로 이동한다', async ({ page }) => {
  await page.route('http://127.0.0.1:54321/**', (route) => route.abort())
  await page.goto('/village')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('link', { name: '내 마을', exact: true })).toHaveCount(0)
})
