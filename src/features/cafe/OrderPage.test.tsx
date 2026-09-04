import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '../../test/renderWithQuery'
import { OrderPage } from './OrderPage'
import * as api from './api'

vi.mock('./api')

const menu: api.Menu = {
  id: 'm1', category: 'coffee', name: '아메리카노', sort_order: 1,
  options: { temperature: ['ice', 'hot'], shot: 2, light: true, syrup: false },
}

const openStatus: api.CafeStatus = {
  is_open: true, opens_at: '10:00:00', closes_at: '14:30:00',
  closes_in_seconds: 3600, is_closed_today: false, today_isodow: 7, server_time: '2026-08-31T11:30:00',
}

beforeEach(() => {
  vi.mocked(api.fetchMenus).mockResolvedValue([menu])
  vi.mocked(api.fetchCafeStatus).mockResolvedValue(openStatus)
  vi.mocked(api.placeOrder).mockResolvedValue('order-1')
})

test('담고 제출하면 placeOrder 를 부르고 장바구니를 비운다', async () => {
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))
  await userEvent.click(screen.getByRole('button', { name: /주문하기/ }))

  await waitFor(() => expect(api.placeOrder).toHaveBeenCalledOnce())
  expect(vi.mocked(api.placeOrder).mock.calls[0][0]).toEqual([
    { menu_id: 'm1', menu_name: '아메리카노', option_label: 'ICE · 1잔', options: { temperature: 'ice', shot: 0, light: false, syrup: false }, quantity: 1 },
  ])
  expect(await screen.findByText('주문했어요')).toBeInTheDocument()
})

test('주문에 성공하면 장바구니가 빈다', async () => {
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))
  expect(screen.getByRole('button', { name: /장바구니 1개/ })).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /주문하기/ }))

  expect(await screen.findByText('주문했어요')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '주문하기' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /장바구니 1개/ })).not.toBeInTheDocument()
})

test('마감으로 주문이 거절되면 그 이유를 보여준다', async () => {
  vi.mocked(api.placeOrder).mockRejectedValue(new Error('ORDER_WINDOW_CLOSED'))
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))
  await userEvent.click(screen.getByRole('button', { name: /주문하기/ }))

  expect(await screen.findByText('마감돼서 주문할 수 없어요')).toBeInTheDocument()
})

test('다른 이유로 실패하면 일반 문구를 보여준다', async () => {
  vi.mocked(api.placeOrder).mockRejectedValue(new Error('network down'))
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))
  await userEvent.click(screen.getByRole('button', { name: /주문하기/ }))

  expect(await screen.findByText('주문하지 못했어요')).toBeInTheDocument()
})

test('마감이면 메뉴를 눌러도 옵션 시트가 열리지 않고 이유를 알려준다', async () => {
  vi.mocked(api.fetchCafeStatus).mockResolvedValue({ ...openStatus, is_open: false, closes_in_seconds: 0 })
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(await screen.findByText('마감돼서 담을 수 없어요')).toBeInTheDocument()
})

test('마감이면 주문 버튼을 막고 이유를 보여준다', async () => {
  vi.mocked(api.fetchCafeStatus).mockResolvedValue({ ...openStatus, is_open: false, closes_in_seconds: 0 })
  renderWithQuery(<OrderPage />)
  expect(await screen.findByText('오늘 주문은 마감됐어요')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /주문하기/ })).toBeDisabled()
})
