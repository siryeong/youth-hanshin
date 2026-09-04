import type { CafeStatus } from './api'
import styles from './StatusBanner.module.css'

export function StatusBanner({ status }: { status?: CafeStatus }) {
  if (!status) return null
  if (status.is_closed_today) return <p className={`${styles.banner} ${styles.danger}`}>오늘은 임시 휴무예요</p>
  if (!status.is_open) return <p className={`${styles.banner} ${styles.closed}`}>오늘 주문은 마감됐어요</p>

  const minutes = Math.floor(status.closes_in_seconds / 60)
  if (minutes <= 30) return <p className={`${styles.banner} ${styles.warn}`}>마감까지 {minutes}분 남았어요</p>
  return <p className={`${styles.banner} ${styles.open}`}>지금 주문할 수 있어요 · {status.closes_at.slice(0, 5)} 마감</p>
}
