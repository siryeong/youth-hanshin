export type Theme = 'light' | 'dark' | 'system'

const KEY = 'yh.theme'

export function readTheme(): Theme {
  const saved = localStorage.getItem(KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    localStorage.removeItem(KEY)
    document.documentElement.removeAttribute('data-theme')
    return
  }
  localStorage.setItem(KEY, theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme(): void {
  applyTheme(readTheme())
}
