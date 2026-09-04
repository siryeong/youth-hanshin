import { useCallback, useMemo, useState } from 'react'
import type { CartLine } from './api'

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  const add = useCallback((line: CartLine) => setLines((prev) => [...prev, line]), [])
  const clear = useCallback(() => setLines([]), [])

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const line of lines) map[line.menu_id] = (map[line.menu_id] ?? 0) + line.quantity
    return map
  }, [lines])

  const total = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines])

  return { lines, counts, total, add, clear }
}
