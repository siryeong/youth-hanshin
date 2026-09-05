import { expect, test } from '@playwright/test'

test('카카오 PKCE 로그인·프로필·회원 주문·역할 변경·로그아웃', async ({ page }) => {
  const origin = 'http://127.0.0.1:5178'
  const memberId = 'f2000000-0000-4000-8000-000000000001'
  const menuId = 'f2000000-0000-4000-8000-000000000010'
  let profile = { id: memberId, name: '테스트 청년', gender: null, birth_date: null, phone: null,
    show_gender: false, show_birth_date: false, show_phone: false, role: 'youth', last_seen_at: '2026-09-06T00:00:00Z', village_revision: 0 }
  let saved: Record<string, unknown> | undefined
  let placed: Record<string, unknown> | undefined
  let cancelled: Record<string, unknown> | undefined
  let exchanged = false
  let failSave = true
  await page.routeWebSocket(/.*/, (socket) => socket.close())
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === origin) return route.continue()
    if (url.origin !== 'http://127.0.0.1:54321') return route.abort()
    let body: unknown
    if (url.pathname.endsWith('/authorize')) {
      expect(url.searchParams.get('provider')).toBe('kakao')
      expect(url.searchParams.get('redirect_to')).toBe(`${origin}/login`)
      expect(url.searchParams.get('code_challenge_method')).toBe('s256')
      expect(url.searchParams.get('code_challenge')).toBeTruthy()
      return route.fulfill({ status: 302, headers: { location: `${origin}/login?code=test-code` } })
    } else if (url.pathname.endsWith('/token')) {
      expect(url.searchParams.get('grant_type')).toBe('pkce')
      const exchange = route.request().postDataJSON()
      expect(exchange.auth_code).toBe('test-code')
      expect(exchange.code_verifier).toBeTruthy()
      exchanged = true
      const expiresAt = Math.floor(Date.now() / 1000) + 3600
      const payload = Buffer.from(JSON.stringify({ sub: memberId, role: 'authenticated', exp: expiresAt })).toString('base64url')
      body = { access_token: `e30.${payload}.test-signature`, refresh_token: 'test-refresh', token_type: 'bearer',
        expires_in: 3600, expires_at: expiresAt,
        user: { id: memberId, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {},
          created_at: '2026-09-06T00:00:00Z', last_sign_in_at: '2026-09-06T00:00:00Z' } }
    } else if (url.pathname.endsWith('/logout')) {
      expect(url.searchParams.get('scope')).toBe('local')
      return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"test expired session"}' })
    }
    else if (url.pathname.endsWith('sync_my_profile_v2')) body = profile
    else if (url.pathname.endsWith('profiles_v2')) {
      expect(route.request().method()).toBe('PATCH')
      expect(url.searchParams.get('id')).toBe(`eq.${memberId}`)
      if (failSave) {
        failSave = false
        return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"test failure"}' })
      }
      saved = route.request().postDataJSON()
      profile = { ...profile, ...saved }
      body = profile
    } else if (url.pathname.endsWith('cafe_status')) body = {
      is_open: true, opens_at: '10:00:00', closes_at: '14:30:00', closes_in_seconds: 3600,
      is_closed_today: false, today_isodow: 7, server_time: '2026-09-06T13:30:00',
    }
    else if (url.pathname.endsWith('menus_public_v2')) body = [{ id: menuId, name: '아메리카노', category: 'coffee', sort_order: 1,
      options: { temperature: ['hot', 'ice'], shot: 2, light: true, syrup: true } }]
    else if (url.pathname.endsWith('orders_v2')) body = [
      { service_date: '2026-09-06', cohort_id: 'current', cohorts_v2: { year: 2026, name: '3기' },
        order_items_v2: [{ id: 'today', menu_name: '오늘 음료', option_label: 'ICE · 1잔', quantity: 1, status: cancelled ? 'cancelled' : 'ordered', created_at: '2026-09-06T03:00:00Z' }] },
      { service_date: '2025-09-07', cohort_id: 'past', cohorts_v2: { year: 2025, name: '2기' },
        order_items_v2: [{ id: 'past', menu_name: '지난 음료', option_label: 'HOT · 1잔', quantity: 1, status: 'ordered', created_at: '2025-09-07T03:00:00Z' }] },
    ]
    else if (url.pathname.endsWith('place_order')) { placed = route.request().postDataJSON(); body = 'order-id' }
    else if (url.pathname.endsWith('cancel_order_item')) { cancelled = route.request().postDataJSON(); body = null }
    else if (url.pathname.endsWith('get_guest_orders')) body = []
    else return route.abort()
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/profile')
  await expect(page).toHaveURL(`${origin}/login`)
  await page.screenshot({ path: test.info().outputPath('login-mobile.png') })
  await page.getByRole('button', { name: '카카오로 시작하기' }).click()
  await expect(page).toHaveURL(`${origin}/profile`)
  expect(exchanged).toBe(true)
  await expect(page.getByLabel('이름', { exact: true })).toHaveValue('테스트 청년')
  for (const label of ['성별 공개', '생년월일 공개', '휴대폰번호 공개']) await expect(page.getByLabel(label)).not.toBeChecked()
  await page.getByLabel('이름', { exact: true }).fill('테스트 수정')
  await page.getByLabel('성별', { exact: true }).selectOption('female')
  await page.getByLabel('생년월일', { exact: true }).fill('9999-01-01')
  await page.getByRole('button', { name: '저장하기' }).click()
  expect(saved).toBeUndefined()
  await page.getByLabel('생년월일', { exact: true }).fill('2000-02-29')
  await page.getByLabel('휴대폰번호', { exact: true }).fill('010-1234-5678')
  await page.getByLabel('성별 공개').check()
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByRole('alert')).toContainText('저장하지 못했어요')
  await expect(page.getByLabel('이름', { exact: true })).toHaveValue('테스트 수정')
  await expect(page.getByLabel('성별 공개')).toBeChecked()
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByText('저장했어요', { exact: true })).toBeVisible()
  expect(saved).toEqual({ name: '테스트 수정', gender: 'female', birth_date: '2000-02-29', phone: '01012345678',
    show_gender: true, show_birth_date: false, show_phone: false })
  await page.screenshot({ path: test.info().outputPath('profile-mobile.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.reload()
  await expect(page.getByLabel('이름', { exact: true })).toHaveValue('테스트 수정')
  await expect(page.getByLabel('성별 공개')).toBeChecked()

  await page.getByRole('link', { name: '내 주문', exact: true }).click()
  await expect(page.getByRole('button', { name: '오늘 음료 주문 취소' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '지난 음료 주문 취소' })).toBeDisabled()
  await page.getByLabel('기수별 주문').selectOption('past')
  await expect(page.getByText('오늘 음료', { exact: true })).toHaveCount(0)
  await expect(page.getByText('지난 음료', { exact: true })).toBeVisible()
  await page.getByLabel('기수별 주문').selectOption('all')
  await page.getByRole('button', { name: '오늘 음료 주문 취소' }).click()
  await expect(page.getByText('취소됨', { exact: true })).toBeVisible()
  expect(cancelled).toEqual({ p_item_id: 'today', p_guest_token: null })

  await page.getByRole('link', { name: '주문', exact: true }).click()
  await page.getByRole('button', { name: '아메리카노', exact: true }).click()
  await page.getByRole('button', { name: '장바구니에 담기' }).click()
  await page.getByRole('button', { name: /장바구니 1개/ }).click()
  await expect(page.getByText('주문했어요', { exact: true })).toBeVisible()
  expect(placed?.p_guest_token).toBeNull()
  await page.getByRole('button', { name: '아메리카노', exact: true }).click()
  await page.getByRole('button', { name: '장바구니에 담기' }).click()
  await page.getByRole('link', { name: '내 주문', exact: true }).click()
  await page.getByLabel('기수별 주문').selectOption('past')
  profile = { ...profile, role: 'staff' }
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  await expect(page).toHaveURL(`${origin}/`)
  await expect(page.getByRole('button', { name: '주문하기', exact: true })).toBeDisabled()
  await expect(page.getByRole('region', { name: '장바구니' })).toHaveCount(0)
  await page.getByRole('link', { name: '내 주문', exact: true }).click()
  await expect(page.getByLabel('기수별 주문')).toHaveValue('all')
  await page.getByRole('link', { name: '내 정보', exact: true }).click()
  await expect(page.getByText('임원', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: test.info().outputPath('profile-desktop-dark.png'), fullPage: true })
  await page.getByRole('button', { name: '로그아웃', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/`)
  await expect(page.getByRole('link', { name: '로그인', exact: true })).toBeVisible()
  await page.getByRole('link', { name: '내 주문', exact: true }).click()
  await expect(page.getByText(/게스트로 주문했어요/)).toBeVisible()
  await expect(page.getByText('지난 음료', { exact: true })).toHaveCount(0)
})

test('카카오 동의 거절은 오류를 표시하고 게스트 주문으로 돌아간다', async ({ page }) => {
  await page.route('http://127.0.0.1:54321/**', (route) => route.abort())
  await page.goto('/login?error=access_denied&error_description=untrusted-message')
  await expect(page.getByRole('alert')).toContainText('로그인하지 못했어요')
  await expect(page.getByText('untrusted-message')).toHaveCount(0)
  await page.getByRole('link', { name: '로그인 없이 음료 주문하기' }).click()
  await expect(page.getByRole('heading', { name: '청년부 카페' })).toBeVisible()
})
