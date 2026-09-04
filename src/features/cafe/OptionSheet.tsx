import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Stepper } from '../../components/ui/Stepper'
import type { CartLine, Menu } from './api'
import { buildOptionLabel, type Selection } from './optionLabel'
import styles from './OptionSheet.module.css'

export function OptionSheet({ menu, onClose, onAdd }: { menu: Menu; onClose: () => void; onAdd: (line: CartLine) => void }) {
  const [selection, setSelection] = useState<Selection>({
    temperature: menu.options.temperature[0],
    shot: 0,
    light: false,
    syrup: false,
    quantity: 1,
  })

  const submit = () => {
    onAdd({
      menu_id: menu.id,
      menu_name: menu.name,
      option_label: buildOptionLabel(selection),
      options: {
        temperature: selection.temperature,
        shot: selection.shot,
        light: selection.light,
        syrup: selection.syrup,
      },
      quantity: selection.quantity,
    })
    onClose()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-label={`${menu.name} 옵션`} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{menu.name}</h2>

        <div className={styles.row}>
          <span className={styles.label}>온도</span>
          <div className={styles.chips}>
            {menu.options.temperature.map((t) => (
              <Chip
                key={t}
                selected={selection.temperature === t}
                onClick={() => setSelection((s) => ({ ...s, temperature: t }))}
              >
                {t.toUpperCase()}
              </Chip>
            ))}
          </div>
        </div>

        {menu.options.shot > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>샷 추가</span>
            <Stepper
              label="샷"
              value={selection.shot}
              min={0}
              max={menu.options.shot}
              onChange={(shot) => setSelection((s) => ({ ...s, shot }))}
            />
          </div>
        )}

        {menu.options.light && (
          <label className={styles.row}>
            <span className={styles.label}>연하게</span>
            <input
              type="checkbox"
              checked={selection.light}
              onChange={(e) => setSelection((s) => ({ ...s, light: e.target.checked }))}
            />
          </label>
        )}

        {menu.options.syrup && (
          <label className={styles.row}>
            <span className={styles.label}>시럽 추가</span>
            <input
              type="checkbox"
              checked={selection.syrup}
              onChange={(e) => setSelection((s) => ({ ...s, syrup: e.target.checked }))}
            />
          </label>
        )}

        <div className={styles.row}>
          <span className={styles.label}>수량</span>
          <Stepper
            label="수량"
            value={selection.quantity}
            min={1}
            max={9}
            onChange={(quantity) => setSelection((s) => ({ ...s, quantity }))}
          />
        </div>

        <p className={styles.summary}>{buildOptionLabel(selection)}</p>
        <Button size="lg" onClick={submit}>장바구니에 담기</Button>
      </div>
    </div>
  )
}
