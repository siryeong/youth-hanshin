import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { MyOrdersPage } from './features/cafe/MyOrdersPage'
import { OrderPage } from './features/cafe/OrderPage'
import { Shell } from './Shell'
import { LoginPage } from './features/auth/LoginPage'
import { ProfilePage } from './features/auth/ProfilePage'
import { VillagePage } from './features/village/VillagePage'
import { OperationsPage } from './features/operations/OperationsPage'
import { RosterPage } from './features/operations/RosterPage'
import { AssignmentPage } from './features/operations/AssignmentPage'
import { CafeOperationsPage } from './features/operations/CafeOperationsPage'
import { AnnouncementsPage } from './features/operations/AnnouncementsPage'

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <OrderPage /> },
      { path: '/orders', element: <MyOrdersPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/village', element: <VillagePage /> },
      { path: '/announcements', element: <AnnouncementsPage /> },
      { path: '/operations', element: <OperationsPage />, children: [
        { index: true, element: <Navigate to="people" replace /> },
        { path: 'people', element: <RosterPage /> },
        { path: 'assignment', element: <AssignmentPage /> },
        { path: 'cafe', element: <CafeOperationsPage /> },
      ] },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
