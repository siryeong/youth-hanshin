import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { Shell } from './Shell'
import { renderWithQuery } from './test/renderWithQuery'

function renderShell() {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [
          { path: '/', element: <p>주문 화면</p> },
          { path: '/orders', element: <p>내 주문 화면</p> },
        ],
      },
    ],
    { initialEntries: ['/'] },
  )
  return renderWithQuery(<RouterProvider router={router} />)
}

test('게스트에게 주문·내 주문·로그인 탭을 보여준다', () => {
  renderShell()
  expect(screen.getAllByRole('link').map((tab) => tab.textContent)).toEqual(['주문', '내 주문', '로그인'])
})

test('내 주문 탭을 누르면 그 화면으로 간다', async () => {
  renderShell()
  expect(screen.getByText('주문 화면')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('link', { name: '내 주문' }))

  expect(await screen.findByText('내 주문 화면')).toBeInTheDocument()
})
