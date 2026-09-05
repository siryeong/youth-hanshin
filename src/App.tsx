import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MyOrdersPage } from './features/cafe/MyOrdersPage'
import { OrderPage } from './features/cafe/OrderPage'
import { Shell } from './Shell'
import { LoginPage } from './features/auth/LoginPage'
import { ProfilePage } from './features/auth/ProfilePage'

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <OrderPage /> },
      { path: '/orders', element: <MyOrdersPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
