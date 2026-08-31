import type { ReactNode } from 'react'
import styles from './Chip.module.css'

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} className={`${styles.chip} ${selected ? styles.selected : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
