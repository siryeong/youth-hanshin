export type Theme = 'light' | 'dark' | 'system'

const KEY = 'yh.theme'

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // 시크릿 모드나 저장소가 막힌 브라우저 — 이번 세션 동안만 system 으로 남는다
    }
    document.documentElement.removeAttribute('data-theme')
    return
  }
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // 시크릿 모드나 저장소가 막힌 브라우저 — 이번 세션 동안만 적용되고 재방문 시 복원되지 않는다
  }
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme(): void {
  applyTheme(readTheme())
}
