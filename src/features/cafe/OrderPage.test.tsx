import { act, fireEvent, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '../../test/renderWithQuery'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { Shell } from '../../Shell'
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
  vi.clearAllMocks()
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

test('연타해도 주문은 한 번만 나간다', async () => {
  // 두 클릭이 리렌더 사이에 들어오는 상황을 재현한다
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))

  const button = screen.getByRole('button', { name: /주문하기/ })
  fireEvent.click(button)
  fireEvent.click(button)

  await waitFor(() => expect(api.placeOrder).toHaveBeenCalledTimes(1))
})

test('토스트는 잠시 뒤 스스로 사라진다', async () => {
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: /아메리카노/ }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))

  const toast = await screen.findByText('아메리카노 담았어요')
  await waitForElementToBeRemoved(toast, { timeout: 4000 })
})

test('마감이면 주문 버튼을 막고 이유를 보여준다', async () => {
  vi.mocked(api.fetchCafeStatus).mockResolvedValue({ ...openStatus, is_open: false, closes_in_seconds: 0 })
  renderWithQuery(<OrderPage />)
  expect(await screen.findByText('오늘 주문은 마감됐어요')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /주문하기/ })).toBeDisabled()
})

test('메뉴 조회 실패를 알리고 다시 불러올 수 있다', async () => {
  vi.mocked(api.fetchMenus).mockRejectedValueOnce(new Error('offline'))
  renderWithQuery(<OrderPage />)
  await userEvent.click(await screen.findByRole('button', { name: '메뉴 다시 불러오기' }))
  expect(await screen.findByRole('button', { name: '아메리카노' })).toBeInTheDocument()
})

test('영업 상태 조회 실패를 마감으로 표시하지 않고 재시도한다', async () => {
  vi.mocked(api.fetchCafeStatus).mockRejectedValueOnce(new Error('offline'))
  renderWithQuery(<OrderPage />)
  expect(await screen.findByRole('button', { name: '시간 다시 확인하기' })).toBeInTheDocument()
  expect(screen.queryByText('오늘 주문은 마감됐어요')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: '시간 다시 확인하기' }))
  expect(await screen.findByText(/지금 주문할 수 있어요/)).toBeInTheDocument()
})


test('탭을 왕복해도 장바구니와 제출 잠금이 유지되고 실패 후 수정할 수 있다', async () => {
  let rejectOrder!: (error: Error) => void
  vi.mocked(api.placeOrder).mockImplementation(() => new Promise((_, reject) => { rejectOrder = reject }))
  const router = createMemoryRouter([{ element: <Shell />, children: [
    { path: '/', element: <OrderPage /> },
    { path: '/orders', element: <p>내 주문 화면</p> },
  ] }])
  renderWithQuery(<RouterProvider router={router} />)
  await userEvent.click(await screen.findByRole('button', { name: '아메리카노' }))
  await userEvent.click(screen.getByRole('button', { name: '장바구니에 담기' }))
  await userEvent.click(screen.getByRole('link', { name: '내 주문' }))
  await userEvent.click(screen.getByRole('link', { name: '주문' }))
  await userEvent.click(screen.getByRole('button', { name: /장바구니 1개/ }))
  await userEvent.click(screen.getByRole('link', { name: '내 주문' }))
  await userEvent.click(screen.getByRole('link', { name: '주문' }))
  expect(screen.getByRole('button', { name: /장바구니 1개/ })).toBeDisabled()
  expect(screen.getByRole('button', { name: /항목 삭제/ })).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: '아메리카노 1개 담김' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await act(async () => rejectOrder(new Error('offline')))
  expect(screen.getByRole('button', { name: /장바구니 1개/ })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: /항목 수량 늘리기/ }))
  expect(screen.getByRole('button', { name: /장바구니 2개/ })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /항목 삭제/ }))
  expect(screen.getByRole('button', { name: '주문하기' })).toBeDisabled()
  expect(api.placeOrder).toHaveBeenCalledOnce()
})
