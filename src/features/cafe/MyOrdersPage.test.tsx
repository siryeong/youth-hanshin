import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '../../test/renderWithQuery'
import { MyOrdersPage } from './MyOrdersPage'
import * as api from './api'

vi.mock('./api')

const item: api.GuestOrderItem = {
  item_id: 'i1', menu_name: '아메리카노', option_label: 'ICE · 샷 1', quantity: 2,
  status: 'ordered', ordered_at: '2026-08-31T11:24:00',
}

const openStatus: api.CafeStatus = {
  is_open: true, opens_at: '10:00:00', closes_at: '14:30:00',
  closes_in_seconds: 720, is_closed_today: false, today_isodow: 7, server_time: '2026-08-31T14:18:00',
}

beforeEach(() => {
  vi.mocked(api.fetchGuestOrders).mockResolvedValue([item])
  vi.mocked(api.fetchCafeStatus).mockResolvedValue(openStatus)
  vi.mocked(api.cancelOrderItem).mockResolvedValue()
})

test('오늘 주문과 옵션, 수량을 보여준다', async () => {
  renderWithQuery(<MyOrdersPage />)
  expect(await screen.findByText('아메리카노')).toBeInTheDocument()
  expect(screen.getByText('ICE · 샷 1')).toBeInTheDocument()
  expect(screen.getByText('2잔')).toBeInTheDocument()
})

test('취소를 누르면 cancelOrderItem 을 부른다', async () => {
  renderWithQuery(<MyOrdersPage />)
  await userEvent.click(await screen.findByRole('button', { name: '아메리카노 주문 취소' }))
  await waitFor(() => expect(api.cancelOrderItem).toHaveBeenCalledWith('i1', expect.any(String)))
})

test('마감이면 취소 버튼을 막는다', async () => {
  vi.mocked(api.fetchCafeStatus).mockResolvedValue({ ...openStatus, is_open: false, closes_in_seconds: 0 })
  renderWithQuery(<MyOrdersPage />)
  expect(await screen.findByRole('button', { name: '아메리카노 주문 취소' })).toBeDisabled()
})

test('조회 실패를 빈 주문으로 표시하지 않고 재시도한다', async () => {
  vi.mocked(api.fetchGuestOrders).mockRejectedValueOnce(new Error('offline'))
  renderWithQuery(<MyOrdersPage />)
  const retry = await screen.findByRole('button', { name: '주문 내역 다시 불러오기' })
  expect(screen.queryByText('아직 주문한 음료가 없어요')).not.toBeInTheDocument()
  await userEvent.click(retry)
  expect(await screen.findByText('아메리카노')).toBeInTheDocument()
})
