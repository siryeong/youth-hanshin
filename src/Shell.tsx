import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { CartProvider } from './features/cafe/CartProvider'
import { useAuth } from './features/auth/useAuth'
import styles from './Shell.module.css'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.tab} ${styles.on}` : styles.tab

export function Shell() {
  const { profile } = useAuth()
  const identity = profile ? `${profile.id}:${profile.role}` : 'guest'
  const [previousIdentity, setPreviousIdentity] = useState(identity)
  const location = useLocation()
  if (previousIdentity !== identity) {
    if (location.pathname !== '/') return <Navigate to="/" replace />
    setPreviousIdentity(identity)
  }

  return <AccountShell key={identity} />
}

function AccountShell() {
  const { profile } = useAuth()
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }))
  useEffect(() => () => client.clear(), [client])

  return (
    <QueryClientProvider client={client}>
    <CartProvider>
      <div className={styles.shell}>
        <Outlet />
        <nav className={styles.tabs} aria-label="주요 메뉴">
          <NavLink to="/" end className={tabClass}>
            주문
          </NavLink>
          <NavLink to="/orders" className={tabClass}>
            내 주문
          </NavLink>
          <NavLink to={profile ? '/profile' : '/login'} className={tabClass}>
            {profile ? '내 정보' : '로그인'}
          </NavLink>
        </nav>
      </div>
    </CartProvider>
    </QueryClientProvider>
  )
}
