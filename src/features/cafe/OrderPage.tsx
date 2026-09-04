import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { getGuestToken } from '../../lib/guestToken'
import { fetchMenus, placeOrder, type Menu, type MenuCategory } from './api'
import { CategoryTabs } from './CategoryTabs'
import { MenuGrid } from './MenuGrid'
import { OptionSheet } from './OptionSheet'
import { StatusBanner } from './StatusBanner'
import { useCafeStatus } from './useCafeStatus'
import { useCart } from './useCart'
import styles from './OrderPage.module.css'

export function OrderPage() {
  const [category, setCategory] = useState<MenuCategory>('coffee')
  const [picked, setPicked] = useState<Menu | null>(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)
  // disabled 는 리렌더가 끝나야 걸린다. 같은 렌더의 isPending 을 다시 읽어봐야 값이 같으므로
  // 연타를 막지 못한다. 렌더와 무관하게 동기적으로 세우는 플래그가 필요하다.
  const submitting = useRef(false)
  const cart = useCart()

  // 토스트는 스스로 사라져야 한다. 안 그러면 "담았어요" 가 주문을 마친 뒤에도 화면에 남는다.
  const showToast = (text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2500)
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const menus = useQuery({ queryKey: ['menus'], queryFn: fetchMenus })

  const submit = useMutation({
    mutationFn: () => placeOrder(cart.lines, getGuestToken()),
    onSuccess: () => {
      cart.clear()
      showToast('주문했어요')
      queryClient.invalidateQueries({ queryKey: ['guest-orders'] })
    },
    onError: (error: Error) => {
      showToast(error.message.includes('ORDER_WINDOW_CLOSED') ? '마감돼서 주문할 수 없어요' : '주문하지 못했어요')
      queryClient.invalidateQueries({ queryKey: ['cafe-status'] })
    },
    onSettled: () => {
      submitting.current = false
    },
  })

  const isOpen = status.data?.is_open ?? false
  const visible = (menus.data ?? []).filter((menu) => menu.category === category)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>청년부 카페</h1>
      </header>

      <StatusBanner status={status.data} />
      <CategoryTabs value={category} onChange={setCategory} />
      <MenuGrid
        menus={visible}
        counts={cart.counts}
        onPick={(menu) => {
          // 마감 후 카드를 눌렀을 때 아무 일도 안 일어나면 화면이 죽은 것처럼 보인다
          if (!isOpen) {
            showToast('마감돼서 담을 수 없어요')
            return
          }
          setPicked(menu)
        }}
      />

      {toast && <p className={styles.toast}>{toast}</p>}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Button
            size="lg"
            disabled={!isOpen || cart.total === 0 || submit.isPending}
            onClick={() => {
              if (submitting.current) return
              submitting.current = true
              submit.mutate()
            }}
          >
            {cart.total > 0 ? `장바구니 ${cart.total}개 · 주문하기` : '주문하기'}
          </Button>
        </div>
      </footer>

      {picked && (
        <OptionSheet
          menu={picked}
          onClose={() => setPicked(null)}
          onAdd={(line) => {
            cart.add(line)
            showToast(`${line.menu_name} 담았어요`)
          }}
        />
      )}
    </div>
  )
}
