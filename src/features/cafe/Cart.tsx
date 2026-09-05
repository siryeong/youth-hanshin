import { Button } from '../../components/ui/Button'
import { Stepper } from '../../components/ui/Stepper'
import { useCart } from './useCart'
import styles from './OrderPage.module.css'

export function Cart() {
  const cart = useCart()
  if (cart.lines.length === 0) return null
  return (
    <section aria-label="장바구니">
      <h2 className={styles.cartTitle}>장바구니</h2>
      <fieldset className={styles.cart} disabled={cart.isPending}>
        {cart.lines.map((line, index) => (
          <div className={styles.cartLine} key={index}>
            <strong>{line.menu_name}</strong>
            <span>{line.option_label}</span>
            <Stepper label={`${line.menu_name} ${index + 1}번째 항목 수량`} value={line.quantity} min={1} max={9}
              onChange={(quantity) => cart.setQuantity(index, quantity)} />
            <Button variant="secondary" ariaLabel={`${line.menu_name} ${index + 1}번째 항목 삭제`}
              onClick={() => cart.remove(index)}>삭제</Button>
          </div>
        ))}
      </fieldset>
    </section>
  )
}
