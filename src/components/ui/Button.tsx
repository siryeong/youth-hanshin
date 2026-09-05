import type { ReactNode } from 'react'
import styles from './Button.module.css'

type Props = {
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
  size?: 'lg' | 'md'
  disabled?: boolean
  ariaLabel?: string
  onClick?: () => void
  children: ReactNode
}

export function Button({ type = 'button', variant = 'primary', size = 'md', disabled, ariaLabel, onClick, children }: Props) {
  const className = [styles.button, styles[variant], size === 'lg' ? styles.lg : ''].join(' ').trim()
  return (
    <button type={type} aria-label={ariaLabel} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
