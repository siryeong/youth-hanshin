import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { getGuestToken } from '../../lib/guestToken'
import { useToast } from '../../lib/useToast'
import { cancelOrderItem, fetchGuestOrders } from './api'
import { StatusBanner } from './StatusBanner'
import { useCafeStatus } from './useCafeStatus'
import { useOrderRealtime } from './useOrderRealtime'
import styles from './MyOrdersPage.module.css'

export function MyOrdersPage() {
  const token = getGuestToken()
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const orders = useQuery({
    queryKey: ['guest-orders', token],
    queryFn: () => fetchGuestOrders(token),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
  const { toast, showToast } = useToast()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['guest-orders'] }),
    [queryClient],
  )
  // 1단계에서 이 구독은 게스트에게 아무 이벤트도 주지 않는다 — RLS 가 막는다.
  // 지금 화면을 최신으로 유지하는 것은 위의 refetchOnWindowFocus 와 refetchInterval 이다.
  // 둘을 "실시간이 있으니 불필요한 중복" 으로 오해하고 지우지 말 것.
  useOrderRealtime(invalidate)

  const cancel = useMutation({
    mutationFn: (itemId: string) => cancelOrderItem(itemId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guest-orders'] }),
    onError: (error: Error) => {
      showToast(error.message.includes('ORDER_WINDOW_CLOSED') ? '마감돼서 취소할 수 없어요' : '취소하지 못했어요')
      queryClient.invalidateQueries({ queryKey: ['cafe-status'] })
    },
  })

  const isOpen = status.data?.is_open ?? false
  const items = orders.data ?? []

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내 주문</h1>
      <StatusBanner status={status.data} />

      <p className={styles.guestNote}>
        게스트로 주문했어요. 오늘 마감까지 이 브라우저에서 주문을 보고 취소할 수 있어요.
      </p>

      {toast && <p className={styles.toast}>{toast}</p>}

      {!orders.isLoading && items.length === 0 && <p className={styles.empty}>아직 주문한 음료가 없어요</p>}

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.item_id} className={item.status === 'cancelled' ? styles.cancelled : styles.item}>
            <span className={styles.name}>{item.menu_name}</span>
            <span className={styles.option}>{item.option_label}</span>
            <span className={styles.qty}>{item.quantity}잔</span>
            {item.status === 'ordered' ? (
              <Button
                variant="secondary"
                ariaLabel={`${item.menu_name} 주문 취소`}
                disabled={!isOpen || cancel.isPending}
                onClick={() => cancel.mutate(item.item_id)}
              >
                주문 취소
              </Button>
            ) : (
              <span className={styles.badge}>취소됨</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
