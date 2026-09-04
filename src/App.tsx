import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MyOrdersPage } from './features/cafe/MyOrdersPage'
import { OrderPage } from './features/cafe/OrderPage'
import { Shell } from './Shell'

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <OrderPage /> },
      { path: '/orders', element: <MyOrdersPage /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
