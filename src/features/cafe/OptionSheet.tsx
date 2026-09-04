import { useEffect, useRef, useState } from 'react'
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

  // 시트 안에서 시작해 배경에서 끝난 클릭은 target 이 배경이 된다. 눌린 곳까지 봐야
  // 스테퍼를 드래그하다 고르던 옵션이 통째로 날아가지 않는다.
  const pressedBackdrop = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
    <div
      className={styles.backdrop}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={`${menu.name} 옵션`}>
        <div className={styles.head}>
          <h2 className={styles.title}>{menu.name}</h2>
          <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

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
