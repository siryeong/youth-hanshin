import { expect, test } from '@playwright/test'

test('모바일 모달·가로 스크롤·포커스·장바구니·지연된 주문을 검증한다', async ({ page }) => {
  const menu = { id: '11111111-1111-4111-8111-111111111111', name: '아메리카노', category: 'coffee', sort_order: 1,
    options: { temperature: ['hot', 'ice'], shot: 2, light: true, syrup: true } }
  let release!: () => void
  let submitted: unknown
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin === 'http://127.0.0.1:5178') return route.continue()
    if (url.origin !== 'http://127.0.0.1:54321') return route.abort()
    let body
    if (url.pathname.includes('menus_public_v2')) body = [menu]
    else if (url.pathname.endsWith('cafe_status')) body = {
      is_open: true, opens_at: '10:00:00', closes_at: '14:30:00', closes_in_seconds: 3600,
      is_closed_today: false, today_isodow: 7, server_time: '2026-09-06T13:30:00',
    }
    else if (url.pathname.endsWith('get_guest_orders')) body = []
    else if (url.pathname.endsWith('place_order')) {
      submitted = route.request().postDataJSON().p_items
      await new Promise<void>((resolve) => { release = resolve })
      body = '22222222-2222-4222-8222-222222222222'
    } else return route.abort()
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const card = page.getByRole('button', { name: '아메리카노', exact: true })
  await card.click()
  await expect(page.getByRole('button', { name: '닫기', exact: true })).toBeFocused()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('mobile-options.png') })
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest('dialog'))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(card).toBeFocused()
  await card.click()
  await page.getByRole('button', { name: '장바구니에 담기' }).click()
  await expect(page.getByRole('button', { name: /장바구니 1개/ })).toBeVisible()
  await page.getByRole('link', { name: '내 주문', exact: true }).click()
  await page.getByRole('link', { name: '주문', exact: true }).click()
  await expect(page.getByRole('button', { name: /장바구니 1개/ })).toBeVisible()

  await page.setViewportSize({ width: 844, height: 390 })
  await page.getByRole('button', { name: '아메리카노 1개 담김' }).click()
  await page.getByRole('button', { name: 'ICE', exact: true }).click()
  await page.getByRole('button', { name: '장바구니에 담기' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: test.info().outputPath('landscape-options.png') })
  await page.getByRole('button', { name: '장바구니에 담기' }).click()
  await expect(page.getByRole('button', { name: /장바구니 2개/ })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '아메리카노 2번째 항목 삭제' }).click()
  await page.getByRole('button', { name: '아메리카노 1번째 항목 수량 늘리기' }).click()
  await page.getByRole('button', { name: /장바구니 2개/ }).click()
  await expect.poll(() => submitted).toBeTruthy()
  await page.getByRole('link', { name: '내 주문', exact: true }).click()
  await page.getByRole('link', { name: '주문', exact: true }).click()
  await expect(page.getByRole('button', { name: /장바구니 2개/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: /항목 삭제/ })).toBeDisabled()
  await page.getByRole('button', { name: '아메리카노 2개 담김' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  release()
  await expect(page.getByRole('button', { name: '주문하기', exact: true })).toBeDisabled()
  await expect(page.getByRole('region', { name: '장바구니' })).toHaveCount(0)
  expect(submitted).toEqual([{ menu_id: menu.id, menu_name: menu.name,
    options: { temperature: 'hot', shot: 0, light: false, syrup: false },
    option_label: 'HOT · 2잔', quantity: 2 }])
})
