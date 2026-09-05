import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useToast } from '../../lib/useToast'
import { fetchMenus, type Menu, type MenuCategory } from './api'
import { Cart } from './Cart'
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
  const { toast, showToast } = useToast()
  const cart = useCart()

  const status = useCafeStatus()
  const queryClient = useQueryClient()
  const menus = useQuery({ queryKey: ['menus'], queryFn: fetchMenus })

  const submit = async () => {
    try {
      if (await cart.checkout()) {
        showToast('주문했어요')
        void queryClient.invalidateQueries({ queryKey: ['orders'] })
      }
    } catch (error) {
      const message = (error as Error).message
      showToast(message.includes('ORDER_WINDOW_CLOSED') ? '마감돼서 주문할 수 없어요' : '주문하지 못했어요')
      void queryClient.invalidateQueries({ queryKey: ['cafe-status'] })
    }
  }

  const isOpen = !status.isError && (status.data?.is_open ?? false)
  const visible = (menus.data ?? []).filter((menu) => menu.category === category)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>청년부 카페</h1>
        <ThemeToggle />
      </header>

      <StatusBanner status={status.data} error={status.isError} onRetry={() => void status.refetch()} />
      <CategoryTabs value={category} onChange={setCategory} />
      {menus.isPending && <p role="status">메뉴를 불러오는 중이에요</p>}
      {menus.isError && <div role="alert">메뉴를 불러오지 못했어요. <Button variant="secondary" onClick={() => void menus.refetch()}>메뉴 다시 불러오기</Button></div>}
      <MenuGrid
        menus={visible}
        counts={cart.counts}
        onPick={(menu) => {
          if (cart.isPending) {
            showToast('주문 처리 중이에요')
            return
          }
          if (status.isError || status.isPending) {
            showToast('주문 가능 시간을 확인해 주세요')
            return
          }
          if (!isOpen) {
            showToast('마감돼서 담을 수 없어요')
            return
          }
          setPicked(menu)
        }}
      />

      <Cart />

      {toast && <p role="status" className={styles.toast}>{toast}</p>}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Button
            size="lg"
            disabled={!isOpen || cart.total === 0 || cart.isPending}
            onClick={() => void submit()}
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
