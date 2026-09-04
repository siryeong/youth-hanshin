import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrderPage } from './features/cafe/OrderPage'

export function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <OrderPage />
    </QueryClientProvider>
  )
}
