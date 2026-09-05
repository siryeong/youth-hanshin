import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { buildOptionLabel } from '../cafe/optionLabel'
import { fetchCafeOrders, type Cohort } from './api'
import { summarizeOrders } from './model'
import { useDirectory } from './useOperations'
import { CafeManagement } from './CafeManagement'
import styles from './OperationsPage.module.css'

export function CafeOperationsPage() {
  const [tab, setTab] = useState('orders')
  return <section className={styles.stack}>
    <h2>카페 운영</h2>
    <div className={styles.tabs} aria-label="카페 운영 화면">
      <button type="button" aria-pressed={tab === 'orders'} onClick={() => setTab('orders')}>주문 현황</button>
      <button type="button" aria-pressed={tab === 'settings'} onClick={() => setTab('settings')}>메뉴·운영 시간</button>
    </div>
    {tab === 'orders' ? <OrderDirectory /> : <CafeManagement />}
  </section>
}

function OrderDirectory() {
  const directory = useDirectory()
  if (directory.isPending) return <p role="status">기수 정보를 불러오는 중이에요</p>
  if (directory.isError) return <div role="alert">기수 정보를 불러오지 못했어요. <Button onClick={() => void directory.refetch()}>기수 다시 불러오기</Button></div>
  return <Orders cohorts={directory.data.cohorts} today={directory.data.calendar.today} />
}

function Orders({ cohorts, today }: { cohorts: Cohort[]; today: string }) {
  const [selected, setSelected] = useState('')
  const [date, setDate] = useState(today)
  const [view, setView] = useState('person')
  const cohort = selected || cohorts.find((item) => item.is_active)?.id || 'none'
  const orders = useQuery({ queryKey: ['operations', 'orders', cohort, date], queryFn: () => fetchCafeOrders(cohort === 'none' ? null : cohort, date), enabled: !!date, refetchInterval: 30_000 })
  const items = orders.data ?? []
  const summary = summarizeOrders(items)
  const groups = new Map(items.map((item) => [item.village_id, item.village_name]))
  return <div className={styles.stack}>
    <div className={styles.fields}>
      <label className={styles.field}>주문 기수<select value={cohort} onChange={(event) => setSelected(event.target.value)}>{cohorts.map((item) => <option value={item.id} key={item.id}>{item.year}년 {item.name}</option>)}<option value="none">기수 미지정</option></select></label>
      <label className={styles.field}>주문 날짜<input type="date" max={today} value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value) }} /></label>
    </div>
    <div className={styles.tabs} aria-label="주문 집계 방식">
      <button type="button" aria-pressed={view === 'person'} onClick={() => setView('person')}>개인별 목록</button>
      <button type="button" aria-pressed={view === 'menu'} onClick={() => setView('menu')}>메뉴별 집계</button>
    </div>
    <p className={styles.muted}>주문 당시 소속 마을로 묶어요. 취소한 항목은 집계에서 제외해요.</p>
    {orders.isPending && <p role="status">주문 현황을 불러오는 중이에요</p>}
    {orders.isError && <div role="alert">주문 현황을 불러오지 못했어요. <Button onClick={() => void orders.refetch()}>주문 현황 다시 불러오기</Button></div>}
    {orders.isSuccess && <>
      <div className={styles.hero}><strong>총 {summary.reduce((sum, item) => sum + item.quantity, 0)}잔</strong><span>{date} · 취소 {items.filter((item) => item.status === 'cancelled').reduce((sum, item) => sum + item.quantity, 0)}잔</span></div>
      {!items.length && <p className={styles.card}>선택한 날짜의 주문이 없어요.</p>}
      <div className={styles.board}>{[...groups].map(([id, name]) => <section key={id ?? 'none'} aria-label={`${name} 주문`} className={styles.card}>
        <h3>{name}</h3>
        <ul className={styles.list}>{view === 'person' ? items.filter((item) => item.village_id === id).map((item) => <li key={item.item_id} className={item.status === 'cancelled' ? styles.cancelled : undefined}>
          <div className={styles.row}><strong>{item.person_name}{!item.profile_id && ` · 주문 ${item.order_id.slice(0, 8)}`}</strong><span>{item.status === 'cancelled' ? '취소됨' : `${item.quantity}잔`}</span></div>
          <span>{item.menu_name} · {buildOptionLabel({ ...item.options, quantity: item.quantity })}</span>
        </li>) : summary.filter((item) => item.village_id === id).map((item, index) => <li key={index}>
          <strong>{item.menu_name}</strong><span>{buildOptionLabel({ ...item.options, quantity: item.quantity })}</span>
        </li>)}</ul>
        {view === 'menu' && !summary.some((item) => item.village_id === id) && <p className={styles.muted}>모든 주문이 취소됐어요.</p>}
      </section>)}</div>
    </>}
  </div>
}
