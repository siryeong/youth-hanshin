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

// jsdom에는 dialog의 모달 동작이 없다. 포커스·레이아웃은 브라우저 테스트에서 검증한다.
HTMLDialogElement.prototype.showModal = function () { this.open = true }
HTMLDialogElement.prototype.close = function () { this.open = false }
