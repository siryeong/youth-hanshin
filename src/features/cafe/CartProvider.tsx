import type { ReactNode } from 'react'
import { CartContext, useCartState } from './useCart'
import { useAuth } from '../auth/useAuth'

export function CartProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const cart = useCartState(!!profile)
  return <CartContext value={cart}>{children}</CartContext>
}
