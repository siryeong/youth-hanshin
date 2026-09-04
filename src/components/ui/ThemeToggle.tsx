import { useState } from 'react'
import { applyTheme, readTheme } from '../../lib/theme'
import styles from './ThemeToggle.module.css'

function resolveEffectiveTheme(): 'light' | 'dark' {
  const saved = readTheme()
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(resolveEffectiveTheme)

  const next = theme === 'dark' ? 'light' : 'dark'
  const label = theme === 'dark' ? '밝은 테마로 바꾸기' : '어두운 테마로 바꾸기'

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={label}
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
