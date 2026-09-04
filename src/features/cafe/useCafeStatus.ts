import { useQuery } from '@tanstack/react-query'
import { fetchCafeStatus } from './api'

export function useCafeStatus() {
  return useQuery({ queryKey: ['cafe-status'], queryFn: fetchCafeStatus, refetchInterval: 60_000 })
}
