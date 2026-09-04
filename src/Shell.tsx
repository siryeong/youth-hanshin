import { NavLink, Outlet } from 'react-router-dom'
import styles from './Shell.module.css'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.tab} ${styles.on}` : styles.tab

export function Shell() {
  return (
    <div className={styles.shell}>
      <Outlet />
      <nav className={styles.tabs} aria-label="주요 메뉴">
        <NavLink to="/" end className={tabClass}>
          주문
        </NavLink>
        <NavLink to="/orders" className={tabClass}>
          내 주문
        </NavLink>
      </nav>
    </div>
  )
}
