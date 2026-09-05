import { expect, test, type Page } from '@playwright/test'

const userId = 'f4000000-0000-4000-8000-000000000001'

async function operationsApp(page: Page, role: 'pastor' | 'staff' | 'youth' = 'pastor') {
  const state = {
    role, revision: 0, failMove: true, failSave: true, failNews: true,
    members: [
      { id: userId, name: '관리자', gender: null, birth_date: null, phone: null, role, has_account: true, is_dormant: false, last_seen_at: '2026-09-06T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
      { id: 'person-2', name: '김하늘', gender: 'female', birth_date: '2000-02-29', phone: '01000000000', role: 'youth', has_account: true, is_dormant: false, last_seen_at: '2026-09-06T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
      { id: 'person-3', name: '이도현', gender: 'male', birth_date: null, phone: null, role: 'youth', has_account: true, is_dormant: true, last_seen_at: '2024-01-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
    ],
    cohorts: [{ id: 'cohort-1', name: '3기', year: 2026, is_active: true }, { id: 'cohort-old', name: '2기', year: 2025, is_active: false }],
    villages: [{ id: 'village-1', name: '사랑마을', cohort_id: 'cohort-1' }, { id: 'village-2', name: '소망마을', cohort_id: 'cohort-1' }],
    assignments: [{ cohort_id: 'cohort-1', profile_id: 'person-2', village_id: 'village-1' as string | null, is_leader: true }, { cohort_id: 'cohort-1', profile_id: 'person-3', village_id: 'village-1' as string | null, is_leader: false }],
    menus: [{ id: 'menu-1', category: 'coffee', name: '아메리카노', price: 1000, ice_price_delta: 1000, options: { temperature: ['hot', 'ice'], shot: 2, light: true, syrup: true }, sort_order: 0, is_active: true }],
    settings: { weekday: 7, opens_at: '10:00:00', closes_at: '14:30:00' },
    closures: [] as { closed_on: string; reason: string }[],
    news: [] as { id: string; author_id: string; title: string; body: string; created_at: string }[],
    writes: [] as { endpoint: string | undefined; input: Record<string, unknown> }[],
    cancelled: false,
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
    const fail = () => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"test offline"}' })
    let body: unknown
    if (endpoint === 'sync_my_profile_v2') body = { ...state.members[0], role: state.role, show_gender: false, show_birth_date: false, show_phone: false, village_revision: state.revision }
    else if (endpoint === 'village_calendar_v2') body = { today: '2026-09-06', sunday: '2026-09-06', editable_from: '2026-08-16' }
    else if (endpoint === 'roster_v2') body = state.members
    else if (endpoint === 'cohorts_v2') body = state.cohorts
    else if (endpoint === 'villages_v2') body = state.villages
    else if (endpoint === 'village_members_v2') body = state.assignments
    else if (endpoint === 'save_roster_member_v2') {
      if (state.failSave) { state.failSave = false; return fail() }
      const member = state.members.find((item) => item.id === input.p_id)
      if (member) Object.assign(member, { name: input.p_name, gender: input.p_gender, birth_date: input.p_birth_date, phone: input.p_phone })
      else state.members.push({ ...state.members[1], id: 'manual-new', name: input.p_name, gender: input.p_gender, birth_date: input.p_birth_date, phone: input.p_phone, has_account: false })
      body = input.p_id ?? 'manual-new'
    }
    else if (endpoint === 'delete_roster_member_v2') { state.members = state.members.filter((item) => item.id !== input.p_id); body = null }
    else if (endpoint === 'set_member_role_v2') { state.members.find((item) => item.id === input.p_id)!.role = input.p_role; body = null }
    else if (endpoint === 'assign_members_v2') {
      if (state.failMove) { state.failMove = false; return fail() }
      for (const profileId of input.p_profile_ids) {
        const item = state.assignments.find((row) => row.profile_id === profileId && row.cohort_id === input.p_cohort_id)
        if (item) { if (item.village_id !== input.p_village_id) item.is_leader = false; item.village_id = input.p_village_id }
        else state.assignments.push({ cohort_id: input.p_cohort_id, profile_id: profileId, village_id: input.p_village_id, is_leader: false })
      }
      body = null
    }
    else if (endpoint === 'set_village_leader_v2') { state.assignments.find((item) => item.profile_id === input.p_profile_id && item.cohort_id === input.p_cohort_id)!.is_leader = input.p_is_leader; body = null }
    else if (endpoint === 'create_village_v2') { state.villages.push({ id: `village-${state.villages.length + 1}`, cohort_id: input.p_cohort_id, name: input.p_name }); body = state.villages[state.villages.length - 1].id }
    else if (endpoint === 'delete_village_v2') { state.villages = state.villages.filter((item) => item.id !== input.p_village_id); body = null }
    else if (endpoint === 'create_cohort_v2') {
      state.cohorts.forEach((item) => { item.is_active = false })
      state.cohorts.unshift({ id: 'cohort-2', name: input.p_name, year: input.p_year, is_active: true })
      state.assignments.push(...state.members.map((item) => ({ cohort_id: 'cohort-2', profile_id: item.id, village_id: null, is_leader: false })))
      body = 'cohort-2'
    }
    else if (endpoint === 'cafe_orders_v2') body = [
      { item_id: 'item-1', order_id: 'order-1', village_id: 'village-1', village_name: '사랑마을', profile_id: 'person-2', person_name: '김하늘', menu_name: '아메리카노', options: { temperature: 'ice', shot: 1, light: false, syrup: false }, quantity: 2, status: state.cancelled ? 'cancelled' : 'ordered' },
      { item_id: 'item-2', order_id: 'order-2', village_id: 'village-1', village_name: '사랑마을', profile_id: 'person-3', person_name: '이도현', menu_name: '아메리카노', options: { syrup: false, light: false, shot: 1, temperature: 'ice' }, quantity: 3, status: 'ordered' },
      { item_id: 'item-3', order_id: 'order-3', village_id: 'village-1', village_name: '사랑마을', profile_id: 'person-3', person_name: '이도현', menu_name: '라떼', options: { temperature: 'hot', shot: 0, light: false, syrup: false }, quantity: 9, status: 'cancelled' },
    ]
    else if (endpoint === 'menus_v2' && method === 'GET') body = state.menus
    else if (endpoint === 'menus_v2') {
      if (method === 'POST') state.menus.push({ ...input, id: 'menu-new' })
      if (method === 'PATCH') Object.assign(state.menus.find((item) => item.id === id)!, input)
      if (method === 'DELETE') state.menus = state.menus.filter((item) => item.id !== id)
      body = { id: id ?? 'menu-new' }
    }
    else if (endpoint === 'cafe_settings_v2') { if (input) state.settings = input; body = state.settings }
    else if (endpoint === 'cafe_closures_v2') {
      if (method === 'GET') body = state.closures
      else {
        if (method === 'POST') state.closures.push(input)
        if (method === 'DELETE') state.closures = state.closures.filter((item) => item.closed_on !== url.searchParams.get('closed_on')?.replace('eq.', ''))
        body = { closed_on: input?.closed_on ?? '2026-09-06' }
      }
    }
    else if (endpoint === 'announcements_v2') {
      if (method === 'GET') body = state.news
      else {
        if (state.failNews) { state.failNews = false; return fail() }
        if (method === 'POST') state.news.unshift({ ...input, id: 'news-1', author_id: userId, created_at: '2026-09-06T00:00:00Z' })
        if (method === 'PATCH') Object.assign(state.news.find((item) => item.id === id)!, input)
        if (method === 'DELETE') state.news = state.news.filter((item) => item.id !== id)
        body = { id: id ?? 'news-1' }
      }
    }
    else return route.abort()
    if (input && endpoint !== 'sync_my_profile_v2' && endpoint !== 'village_calendar_v2' && endpoint !== 'cafe_orders_v2') state.writes.push({ endpoint, input })
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  return state
}

test('목회자는 휴면 인원을 보존하며 명단 수정부터 다음 해 편성까지 진행한다', async ({ page }) => {
  const state = await operationsApp(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/operations/people')
  await expect(page.getByText('전체 명단 3명')).toBeVisible()
  await expect(page.getByText(/01000000000/)).toHaveCount(0)
  await page.getByRole('combobox', { name: '접속 상태', exact: true }).selectOption('dormant')
  await expect(page.getByText('이도현', { exact: true })).toBeVisible()
  await expect(page.getByText('김하늘', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /삭제/ })).toHaveCount(0)
  await page.getByRole('combobox', { name: '접속 상태', exact: true }).selectOption('all')
  await page.getByLabel('개인정보 마스킹 해제').check()
  await expect(page.getByText(/01000000000/)).toBeVisible()
  await page.getByRole('button', { name: '김하늘 정보 수정' }).click()
  await page.getByRole('form', { name: '인원 수정' }).getByLabel('이름', { exact: true }).fill('김하늘 수정')
  await page.getByRole('button', { name: '명단 저장' }).click()
  await expect(page.getByRole('alert')).toContainText('저장하지 못했어요')
  await expect(page.getByRole('form', { name: '인원 수정' }).getByLabel('이름', { exact: true })).toHaveValue('김하늘 수정')
  await page.getByRole('button', { name: '명단 저장' }).click()
  await expect(page.getByRole('form', { name: '인원 수정' })).toHaveCount(0)
  await page.getByLabel('김하늘 수정 역할').selectOption('staff')
  await expect.poll(() => state.members[1].role).toBe('staff')
  await page.getByRole('link', { name: '마을 편성', exact: true }).click()
  await page.getByLabel('이도현 선택').check()
  await page.getByRole('button', { name: '소망마을 여기로 이동' }).click()
  await expect(page.getByRole('alert')).toContainText('선택은 유지돼요')
  await expect(page.getByLabel('이도현 선택')).toBeChecked()
  await page.getByRole('button', { name: '소망마을 여기로 이동' }).click()
  await expect(page.getByRole('region', { name: '소망마을 편성' }).getByLabel('이도현 선택')).toBeVisible()
  await page.getByLabel('이도현 이장').check()
  await expect.poll(() => state.assignments.find((item) => item.profile_id === 'person-3')?.is_leader).toBe(true)
  await page.screenshot({ path: test.info().outputPath('assignment-mobile.png'), fullPage: true })
  await page.getByLabel('편성 기수').selectOption('cohort-old')
  await page.getByRole('button', { name: '새 기수 만들기' }).click()
  await page.getByLabel('기수 이름').fill('4기')
  await page.getByLabel('기수 전환을 확인했어요').check()
  await page.getByRole('button', { name: '기수 생성·전환' }).click()
  await expect(page.getByLabel('편성 기수')).toHaveValue('cohort-2')
  await expect(page.getByRole('region', { name: '미배정 편성' }).getByLabel('이도현 선택')).toBeVisible()
  await page.getByLabel('새 마을 이름').fill('봄마을')
  await page.getByRole('button', { name: '마을 생성', exact: true }).click()
  await page.getByLabel('이도현 선택').check()
  await page.getByRole('button', { name: '봄마을 여기로 이동' }).click()
  await expect(page.getByRole('region', { name: '봄마을 편성' }).getByLabel('이도현 선택')).toBeVisible()
  await page.getByLabel('편성 기수').selectOption('cohort-1')
  await expect(page.getByLabel('이도현 선택')).toBeDisabled()
  await expect(page.getByRole('region', { name: '소망마을 편성' }).getByLabel('이도현 이장')).toBeChecked()
  await expect(page.getByRole('button', { name: '마을 생성', exact: true })).toBeDisabled()
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('button', { name: '어두운 테마로 바꾸기' }).click()
  await page.screenshot({ path: test.info().outputPath('assignment-desktop-dark.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('임원은 드래그로 이동하고 카페 설정·주문 집계·전체 소식을 관리하지만 역할은 변경하지 못한다', async ({ page }) => {
  const state = await operationsApp(page, 'staff')
  state.failMove = false
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/operations/assignment')
  await expect(page.getByLabel('김하늘 이장')).toBeDisabled()
  await page.getByLabel('김하늘 선택').locator('..').locator('..').dragTo(page.getByRole('region', { name: '소망마을 편성' }))
  await expect(page.getByRole('region', { name: '소망마을 편성' }).getByLabel('김하늘 선택')).toBeVisible()
  await expect(page.getByLabel('김하늘 이장')).not.toBeChecked()
  await page.getByRole('link', { name: '전체 명단', exact: true }).click()
  await expect(page.getByLabel('김하늘 역할')).toBeDisabled()
  await page.getByRole('link', { name: '카페 운영', exact: true }).click()
  await expect(page.getByText('총 5잔', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '메뉴별 집계' }).click()
  await expect(page.getByRole('region', { name: '사랑마을 주문' }).getByText('ICE · 샷 1 · 5잔')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('cafe-desktop.png'), fullPage: true })
  state.cancelled = true
  await page.getByLabel('주문 날짜').fill('2026-09-05')
  await expect(page.getByText('총 3잔', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '메뉴·운영 시간' }).click()
  await page.getByLabel('시작 시각').fill('15:00')
  await expect(page.getByRole('button', { name: '운영 시간 저장' })).toBeDisabled()
  await page.getByLabel('시작 시각').fill('09:30')
  await page.getByRole('button', { name: '운영 시간 저장' }).click()
  await expect.poll(() => state.settings.opens_at).toBe('09:30')
  await page.getByLabel('휴무 날짜').fill('2026-09-06')
  await page.getByLabel('휴무 사유').fill('수련회')
  await page.getByRole('button', { name: '임시 휴무 저장' }).click()
  await expect(page.getByText('2026-09-06 · 수련회')).toBeVisible()
  await page.getByRole('button', { name: '2026-09-06 휴무 해제' }).click()
  await expect(page.getByText('2026-09-06 · 수련회')).toHaveCount(0)
  await page.getByRole('button', { name: '메뉴 추가', exact: true }).click()
  await page.getByLabel('메뉴 이름').fill('신메뉴')
  await page.getByLabel('가격', { exact: true }).fill('2500')
  await page.getByRole('button', { name: '메뉴 저장' }).click()
  await expect(page.getByRole('button', { name: '신메뉴 메뉴 수정' })).toBeVisible()
  await page.getByRole('button', { name: '신메뉴 메뉴 삭제' }).click()
  await page.getByRole('button', { name: '메뉴 삭제 확인' }).click()
  await expect(page.getByRole('button', { name: '신메뉴 메뉴 수정' })).toHaveCount(0)
  await page.getByRole('link', { name: '전체 소식', exact: true }).first().click()
  await page.getByRole('button', { name: '전체 소식 올리기' }).click()
  await page.getByLabel('소식 제목').fill('가을 모임')
  await page.getByLabel('전체 소식 내용').fill('함께 만나요.')
  await page.getByRole('button', { name: '전체 소식 저장' }).click()
  await expect(page.getByRole('alert')).toContainText('입력한 내용은 유지돼요')
  await expect(page.getByLabel('소식 제목')).toHaveValue('가을 모임')
  await page.getByRole('button', { name: '전체 소식 저장' }).click()
  await expect(page.getByRole('heading', { name: '가을 모임' })).toBeVisible()
  await page.getByRole('button', { name: '전체 소식 수정: 가을 모임' }).click()
  await page.getByLabel('전체 소식 내용').fill('수정한 공지입니다.')
  await page.getByRole('button', { name: '전체 소식 저장' }).click()
  await expect(page.getByText('수정한 공지입니다.')).toBeVisible()
  await page.getByRole('button', { name: '전체 소식 삭제: 가을 모임' }).click()
  await page.getByRole('button', { name: '삭제 확인', exact: true }).click()
  await expect(page.getByRole('heading', { name: '가을 모임' })).toHaveCount(0)
})

test('청년에게 운영 권한을 비활성 상태로 표시하고 전체 소식은 조회만 제공한다', async ({ page }) => {
  const state = await operationsApp(page, 'youth')
  state.news.push({ id: 'news-1', author_id: 'person-2', title: '청년부 안내', body: '다음 주에 만나요.', created_at: '2026-09-06T00:00:00Z' })
  await page.goto('/operations/assignment')
  await expect(page.getByRole('button', { name: '인원 이동' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '이장 지정' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '역할 지정' })).toBeDisabled()
  await expect(page.getByLabel('이도현 선택')).toHaveCount(0)
  await page.getByRole('link', { name: '전체 소식', exact: true }).click()
  await expect(page.getByRole('heading', { name: '청년부 안내' })).toBeVisible()
  await expect(page.getByRole('button', { name: '전체 소식 올리기' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '전체 소식 수정: 청년부 안내' })).toHaveCount(0)
  expect(state.writes).toHaveLength(0)
})
