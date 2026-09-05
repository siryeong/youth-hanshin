import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDirectory } from './api'

export function useDirectory() {
  return useQuery({ queryKey: ['operations', 'directory'], queryFn: fetchDirectory, refetchInterval: 30_000 })
}

export function useOperation<T>(action: (input: T) => Promise<unknown>, onSuccess?: () => void) {
  const client = useQueryClient()
  return useMutation({ mutationFn: action, onSuccess: async () => {
    onSuccess?.()
    await Promise.all(['operations', 'village', 'announcements', 'menus', 'cafe-status'].map((key) => client.invalidateQueries({ queryKey: [key] })))
  } })
}
