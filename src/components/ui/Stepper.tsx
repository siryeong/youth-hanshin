import styles from './Stepper.module.css'

type Props = { value: number; min: number; max: number; onChange: (next: number) => void; label: string }

export function Stepper({ value, min, max, onChange, label }: Props) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.step}
        aria-label={`${label} 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className={styles.value}>{value}</span>
      <button
        type="button"
        className={styles.step}
        aria-label={`${label} 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
