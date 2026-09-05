import { createContext, useContext, useRef, useState } from 'react'
import { getGuestToken } from '../../lib/guestToken'
import { placeOrder, type CartLine } from './api'
import { buildOptionLabel } from './optionLabel'

export function useCartState() {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isPending, setPending] = useState(false)
  const submitting = useRef(false)

  const add = (line: CartLine) => {
    if (!submitting.current) setLines((prev) => [...prev, line])
  }
  const remove = (index: number) => {
    if (!submitting.current) setLines((prev) => prev.filter((_, i) => i !== index))
  }
  const setQuantity = (index: number, quantity: number) => {
    if (submitting.current || !Number.isInteger(quantity) || quantity < 1 || quantity > 9) return
    setLines((prev) => prev.map((line, i) => i === index
      ? { ...line, quantity, option_label: buildOptionLabel({ ...line.options, quantity }) }
      : line))
  }
  const checkout = async () => {
    if (submitting.current || lines.length === 0) return false
    submitting.current = true
    setPending(true)
    try {
      await placeOrder(lines, getGuestToken())
      setLines([])
      return true
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  const counts: Record<string, number> = {}
  for (const line of lines) counts[line.menu_id] = (counts[line.menu_id] ?? 0) + line.quantity
  const total = lines.reduce((sum, line) => sum + line.quantity, 0)

  return { lines, counts, total, add, remove, setQuantity, checkout, isPending }
}

export const CartContext = createContext<ReturnType<typeof useCartState> | null>(null)

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('CartProvider is required')
  return cart
}
