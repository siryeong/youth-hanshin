import { expect, test } from '@playwright/test'

test('게스트가 주문하고 취소한다', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /아메리카노/ }).click()
  await page.getByRole('button', { name: '장바구니에 담기' }).click()
  await page.getByRole('button', { name: /주문하기/ }).click()
  await expect(page.getByText('주문했어요')).toBeVisible()

  await page.goto('/orders')
  await expect(page.getByText('아메리카노')).toBeVisible()
  await page.getByRole('button', { name: '아메리카노 주문 취소' }).click()
  await expect(page.getByText('취소됨')).toBeVisible()
})
