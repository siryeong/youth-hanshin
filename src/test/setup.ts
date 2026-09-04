import '@testing-library/jest-dom/vitest'

// jsdom 은 matchMedia 를 구현하지 않는다. ThemeToggle 이 system 테마를 풀어내는 데 쓴다.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList
