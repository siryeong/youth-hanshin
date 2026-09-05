import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from '../features/cafe/CartProvider'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { AuthContext } from '../features/auth/useAuth'
import type { Profile } from '../features/auth/api'

export function renderWithQuery(ui: ReactElement, profile: Profile | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><AuthContext value={{ profile, refreshProfile: async () => {} }}><CartProvider>{ui}</CartProvider></AuthContext></QueryClientProvider>)
}
