import { useState } from 'react'
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
  const cart = useCart()
  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const menus = useQuery({ queryKey: ['menus'], queryFn: fetchMenus })

  const submit = useMutation({
    mutationFn: () => placeOrder(cart.lines, getGuestToken()),
    onSuccess: () => {
      cart.clear()
      setToast('주문했어요')
      queryClient.invalidateQueries({ queryKey: ['guest-orders'] })
    },
    onError: (error: Error) => {
      setToast(error.message.includes('ORDER_WINDOW_CLOSED') ? '마감돼서 주문할 수 없어요' : '주문하지 못했어요')
      queryClient.invalidateQueries({ queryKey: ['cafe-status'] })
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
      <MenuGrid menus={visible} counts={cart.counts} onPick={(menu) => isOpen && setPicked(menu)} />

      {toast && <p className={styles.toast}>{toast}</p>}

      <footer className={styles.footer}>
        <Button
          size="lg"
          disabled={!isOpen || cart.total === 0 || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {cart.total > 0 ? `장바구니 ${cart.total}개 · 주문하기` : '주문하기'}
        </Button>
      </footer>

      {picked && (
        <OptionSheet
          menu={picked}
          onClose={() => setPicked(null)}
          onAdd={(line) => {
            cart.add(line)
            setToast(`${line.menu_name} 담았어요`)
          }}
        />
      )}
    </div>
  )
}
