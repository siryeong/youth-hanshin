import type { Menu } from './api'
import styles from './MenuGrid.module.css'

function optionSummary(menu: Menu): string {
  const parts = menu.options.temperature.map((t) => t.toUpperCase())
  if (menu.options.shot > 0) parts.push('샷 추가')
  if (menu.options.light) parts.push('연하게')
  if (menu.options.syrup) parts.push('시럽 추가')
  return parts.join(' · ')
}

export function MenuGrid({
  menus,
  counts,
  onPick,
}: {
  menus: Menu[]
  counts: Record<string, number>
  onPick: (menu: Menu) => void
}) {
  return (
    <div className={styles.grid}>
      {menus.map((menu) => {
        const count = counts[menu.id] ?? 0
        const label = count > 0 ? `${menu.name} ${count}개 담김` : menu.name
        return (
          <button
            key={menu.id}
            type="button"
            aria-label={label}
            className={`${styles.card} ${count > 0 ? styles.picked : ''}`}
            onClick={() => onPick(menu)}
          >
            {count > 0 && <span className={styles.count}>{count}</span>}
            <span className={styles.name}>{menu.name}</span>
            <span className={styles.opt}>{optionSummary(menu)}</span>
          </button>
        )
      })}
    </div>
  )
}
