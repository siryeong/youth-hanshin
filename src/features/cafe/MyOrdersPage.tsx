import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { getGuestToken } from '../../lib/guestToken'
import { useToast } from '../../lib/useToast'
import { cancelOrderItem, fetchGuestOrders, fetchMemberOrders, type GuestOrderItem, type MemberOrderItem } from './api'
import { useAuth } from '../auth/useAuth'
import { supabase } from '../../lib/supabase'
import { StatusBanner } from './StatusBanner'
import { useCafeStatus } from './useCafeStatus'
import styles from './MyOrdersPage.module.css'

export function MyOrdersPage() {
  const { profile } = useAuth()
  const token = profile ? null : getGuestToken()
  const [cohort, setCohort] = useState('all')
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const orders = useQuery<(GuestOrderItem | MemberOrderItem)[]>({
    queryKey: ['orders', profile?.id ?? token],
    queryFn: () => profile ? fetchMemberOrders() : fetchGuestOrders(token!),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
  const { toast, showToast } = useToast()

  useEffect(() => {
    if (!profile) return
    const channel = supabase.channel(`orders:${profile.id}`).on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'order_items_v2',
    }, () => { void queryClient.invalidateQueries({ queryKey: ['orders'] }) }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [profile, queryClient])

  const cancel = useMutation({
    mutationFn: (itemId: string) => cancelOrderItem(itemId, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
    onError: (error: Error) => {
      showToast(error.message.includes('ORDER_WINDOW_CLOSED') ? '마감돼서 취소할 수 없어요' : '취소하지 못했어요')
      queryClient.invalidateQueries({ queryKey: ['cafe-status'] })
    },
  })

  const isOpen = !status.isError && (status.data?.is_open ?? false)
  const items = orders.data ?? []
  const cohorts = new Map(items.filter((item): item is MemberOrderItem => 'cohort_id' in item)
    .map((item) => [item.cohort_id ?? 'none', item.cohort_name]))
  const visible = items.filter((item) => cohort === 'all' || ('cohort_id' in item && (item.cohort_id ?? 'none') === cohort))

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내 주문</h1>
      <StatusBanner status={status.data} error={status.isError} onRetry={() => void status.refetch()} />

      {!profile && <p className={styles.guestNote}>
        게스트로 주문했어요. 오늘 마감까지 이 브라우저에서 주문을 보고 취소할 수 있어요.
      </p>}
      {profile && <div className={styles.filter}><label htmlFor="order-cohort">기수별 주문</label>
        <select id="order-cohort" value={cohort} onChange={(event) => setCohort(event.target.value)}>
          <option value="all">전체 기수</option>
          {[...cohorts].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>}

      {toast && <p role="status" className={styles.toast}>{toast}</p>}

      {orders.isPending && <p role="status">주문 내역을 불러오는 중이에요</p>}
      {orders.isError && <div role="alert">주문 내역을 불러오지 못했어요. <Button variant="secondary" onClick={() => void orders.refetch()}>주문 내역 다시 불러오기</Button></div>}
      {orders.isSuccess && visible.length === 0 && <p className={styles.empty}>아직 주문한 음료가 없어요</p>}

      <ul className={styles.list}>
        {visible.map((item) => (
          <li key={item.item_id} className={item.status === 'cancelled' ? styles.cancelled : styles.item}>
            <span className={styles.name}>{item.menu_name}</span>
            <span className={styles.option}>{item.option_label}</span>
            {'service_date' in item && <span className={styles.option}>{item.service_date} · {item.cohort_name}</span>}
            <span className={styles.qty}>{item.quantity}잔</span>
            {item.status === 'ordered' ? (
              <Button
                variant="secondary"
                ariaLabel={`${item.menu_name} 주문 취소`}
                disabled={!isOpen || cancel.isPending || ('service_date' in item && item.service_date !== status.data?.server_time.slice(0, 10))}
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
