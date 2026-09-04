const KEY = 'yh.guestToken'

// 시크릿 모드나 저장소가 막힌 브라우저에서는 localStorage 접근 자체가 예외를 던진다.
// 게스트 주문은 이 앱의 전부이므로, 그때도 이 세션 동안 쓸 토큰으로 물러선다.
// 새로고침하면 지난 주문을 못 보지만, 주문 자체는 된다.
let memoryToken = ''

export function getGuestToken(): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved
    const token = crypto.randomUUID()
    localStorage.setItem(KEY, token)
    return token
  } catch {
    if (!memoryToken) memoryToken = crypto.randomUUID()
    return memoryToken
  }
}
