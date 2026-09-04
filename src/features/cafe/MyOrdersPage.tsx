import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { getGuestToken } from '../../lib/guestToken'
import { cancelOrderItem, fetchGuestOrders } from './api'
import { StatusBanner } from './StatusBanner'
import { useCafeStatus } from './useCafeStatus'
import styles from './MyOrdersPage.module.css'

export function MyOrdersPage() {
  const token = getGuestToken()
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const orders = useQuery({ queryKey: ['guest-orders', token], queryFn: () => fetchGuestOrders(token) })

  const cancel = useMutation({
    mutationFn: (itemId: string) => cancelOrderItem(itemId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guest-orders'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['cafe-status'] }),
  })

  const isOpen = status.data?.is_open ?? false
  const items = orders.data ?? []

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내 주문</h1>
      <StatusBanner status={status.data} />

      <p className={styles.guestNote}>
        게스트로 주문했어요. 브라우저를 닫으면 이 내역을 볼 수 없어요.
      </p>

      {items.length === 0 && <p className={styles.empty}>아직 주문한 음료가 없어요</p>}

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
