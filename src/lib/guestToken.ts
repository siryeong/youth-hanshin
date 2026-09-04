const KEY = 'yh.guestToken'

export function getGuestToken(): string {
  const saved = localStorage.getItem(KEY)
  if (saved) return saved
  const token = crypto.randomUUID()
  localStorage.setItem(KEY, token)
  return token
}
