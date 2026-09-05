import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MyOrdersPage } from './features/cafe/MyOrdersPage'
import { OrderPage } from './features/cafe/OrderPage'
import { Shell } from './Shell'
import { LoginPage } from './features/auth/LoginPage'
import { ProfilePage } from './features/auth/ProfilePage'
import { VillagePage } from './features/village/VillagePage'

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <OrderPage /> },
      { path: '/orders', element: <MyOrdersPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/village', element: <VillagePage /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
