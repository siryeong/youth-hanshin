import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { signIn } from './api'
import { useAuth } from './useAuth'
import styles from './ProfilePage.module.css'

export function LoginPage() {
  const { profile } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(() => {
    const url = new URL(window.location.href)
    return url.searchParams.has('code') || url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error')
  })
  if (profile) return <Navigate to="/profile" replace />

  const login = async () => {
    setError(false)
    setPending(true)
    try { await signIn() } catch { setError(true); setPending(false) }
  }

  return (
    <main className={`${styles.page} ${styles.login}`}>
      <h1 className={styles.hero}>주일 아침,<br />한 곳에서</h1>
      <p>카카오로 로그인하고 내 정보와 주문 기록을 이어서 관리해요.</p>
      <Button size="lg" disabled={pending} onClick={() => void login()}>
        {pending ? '카카오로 이동하고 있어요' : '카카오로 시작하기'}
      </Button>
      {error && <p role="alert">로그인하지 못했어요. 카카오로 시작하기를 다시 눌러 주세요.</p>}
      <Link to="/">로그인 없이 음료 주문하기</Link>
      <p className={styles.note}>생년월일과 연락처는 직접 입력하고, 공개 여부도 직접 정해요.</p>
    </main>
  )
}
