import type { ReactNode } from 'react'
import styles from './Button.module.css'

type Props = {
  variant?: 'primary' | 'accent' | 'secondary' | 'danger'
  size?: 'lg' | 'md'
  disabled?: boolean
  ariaLabel?: string
  onClick?: () => void
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', disabled, ariaLabel, onClick, children }: Props) {
  const className = [styles.button, styles[variant], size === 'lg' ? styles.lg : ''].join(' ').trim()
  return (
    <button type="button" aria-label={ariaLabel} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
