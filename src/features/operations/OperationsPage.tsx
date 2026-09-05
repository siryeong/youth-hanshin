import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuth } from '../auth/useAuth'
import styles from './OperationsPage.module.css'

export function OperationsPage() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  const manager = profile.role !== 'youth'
  return <main className={styles.page}>
    <header className={styles.header}><h1>청년부 운영</h1><ThemeToggle /></header>
    {manager ? <>
      <nav aria-label="운영 메뉴" className={styles.tabs}>
        <NavLink to="/operations/people">전체 명단</NavLink>
        <NavLink to="/operations/assignment">마을 편성</NavLink>
        <NavLink to="/operations/cafe">카페 운영</NavLink>
        <NavLink to="/announcements">전체 소식</NavLink>
      </nav>
      <Outlet />
    </> : <section className={styles.card}>
      <h2>마을 편성·역할 지정</h2>
      <p>마을 편성은 전체 관리자, 임원·이장 지정은 목회자만 할 수 있어요.</p>
      <div className={styles.actions}><Button disabled>인원 이동</Button><Button disabled>이장 지정</Button><Button disabled>역할 지정</Button></div>
    </section>}
  </main>
}
