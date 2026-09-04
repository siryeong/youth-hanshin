import type { MenuCategory } from './api'
import styles from './CategoryTabs.module.css'

const TABS: { id: MenuCategory; label: string }[] = [
  { id: 'coffee', label: '커피' },
  { id: 'non_coffee', label: '논커피' },
  { id: 'cold', label: '음료' },
]

export function CategoryTabs({ value, onChange }: { value: MenuCategory; onChange: (c: MenuCategory) => void }) {
  return (
    <div className={styles.track} role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={`${styles.tab} ${value === tab.id ? styles.on : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
