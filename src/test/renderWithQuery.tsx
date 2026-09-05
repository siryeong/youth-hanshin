import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from '../features/cafe/CartProvider'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><CartProvider>{ui}</CartProvider></QueryClientProvider>)
}
