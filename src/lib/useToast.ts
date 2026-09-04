import { useEffect, useRef, useState } from 'react'

/** 잠시 떴다 스스로 사라지는 안내 문구. 남아 있으면 화면이 굳은 것처럼 보인다. */
export function useToast(duration = 2500) {
  const [toast, setToast] = useState('')
  const timer = useRef<number | undefined>(undefined)

  const showToast = (text: string) => {
    setToast(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(''), duration)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { toast, showToast }
}
