import type { ReactNode } from 'react'
import { CartContext, useCartState } from './useCart'

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartState()
  return <CartContext value={cart}>{children}</CartContext>
}
