import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuth } from '../auth/useAuth'
import { buildOptionLabel } from '../cafe/optionLabel'
import { fetchAttendance, fetchOrderStats, fetchVillage, fetchVillages, renameVillage, type Calendar, type Village } from './api'
import { VillageAttendance } from './VillageAttendance'
import { VillageBoard } from './VillageBoard'
import styles from './VillagePage.module.css'

export function VillagePage() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  return <VillageDirectory />
}

function VillageDirectory() {
  const { profile } = useAuth()
  const client = useQueryClient()
  const [selected, setSelected] = useState('')
  const directory = useQuery({ queryKey: ['village', 'directory'], queryFn: fetchVillages, refetchInterval: 30_000 })
  useEffect(() => {
    void client.invalidateQueries({ queryKey: ['village'] })
  }, [client, profile?.village_revision])

  if (directory.isPending) return <main className={styles.page}><p role="status">마을 정보를 불러오는 중이에요</p></main>
  if (directory.isError) return <main className={styles.page}><p role="alert">마을 정보를 불러오지 못했어요.</p><Button onClick={() => void directory.refetch()}>마을 다시 불러오기</Button></main>
  const { villages, calendar } = directory.data
  const village = villages.find((item) => item.id === selected) ?? villages[0]

  return <main className={styles.page}>
    <header className={styles.header}><h1>내 마을</h1><ThemeToggle /></header>
    {!villages.some((item) => item.cohorts_v2.is_active) && <p className={styles.card}>현재 기수에 배정된 마을이 없어요. 임원에게 배정을 요청해 주세요.</p>}
    {village && <>
      <label className={styles.field}>기수·마을<select value={village.id} onChange={(event) => setSelected(event.target.value)}>
        {villages.map((item) => <option value={item.id} key={item.id}>{item.cohorts_v2.year}년 {item.cohorts_v2.name} · {item.name}{item.cohorts_v2.is_active ? '' : ' (지난 기수)'}</option>)}
      </select></label>
      <VillageContent key={village.id} village={village} calendar={calendar} />
    </>}
  </main>
}

function VillageContent({ village, calendar }: { village: Village; calendar: Calendar }) {
  const { profile, refreshProfile } = useAuth()
  const client = useQueryClient()
  const [date, setDate] = useState(calendar.sunday)
  const [reveal, setReveal] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(village.name)
  const sunday = /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(`${date}T00:00:00Z`).getUTCDay() === 0
  const detail = useQuery({ queryKey: ['village', village.id, 'detail'], queryFn: () => fetchVillage(village.id) })
  const records = useQuery({ queryKey: ['village', village.id, 'attendance', date], queryFn: () => fetchAttendance(village.id, date), enabled: sunday })
  const refresh = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: ['village'] }), refreshProfile()])
  }
  const rename = useMutation({ mutationFn: () => renameVillage(village.id, name), onSuccess: async () => { setEditingName(false); await refresh() } })
  const submitName = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim()) rename.mutate() }

  if (detail.isPending) return <p role="status">마을 기록을 불러오는 중이에요</p>
  if (detail.isError) return <div role="alert">마을 기록을 불러오지 못했어요. <Button onClick={() => void detail.refetch()}>기록 다시 불러오기</Button></div>
  const { members, posts, prayers } = detail.data
  const attendance = records.data ?? []
  const me = members.find((member) => member.profile_id === profile!.id)
  const active = village.cohorts_v2.is_active
  const leader = active && !!me?.is_leader
  const admin = profile!.role !== 'youth'
  const editable = leader && sunday && date >= calendar.editable_from && date <= calendar.sunday
  const leaders = members.filter((member) => member.is_leader).map((member) => member.name)
  const present = (kind: 'worship' | 'meeting') => members.filter((member) => attendance.some((row) => row.profile_id === member.profile_id && row[kind])).length

  return <>
    <section className={styles.hero} aria-label="마을 요약">
      <div className={styles.row}><h2>{village.name}</h2><span>{members.length}명</span></div>
      <p>{village.cohorts_v2.name} · {leaders.length ? `이장 ${leaders.join(', ')}` : '이장 미지정'}</p>
      {sunday && records.isSuccess && <>
        <div><div className={styles.row}><span>예배</span><span>{present('worship')}/{members.length}</span></div><progress aria-label="예배 출석률" value={present('worship')} max={members.length || 1} /></div>
        <div><div className={styles.row}><span>마을모임</span><span>{present('meeting')}/{members.length}</span></div><progress aria-label="마을모임 출석률" value={present('meeting')} max={members.length || 1} /></div>
        <p>{date} 주일 기준</p>
      </>}
    </section>
    {!active && <p className={styles.muted}>지난 기수 기록은 조회만 할 수 있어요.</p>}
    {leader && (editingName ? <form className={styles.card} onSubmit={submitName}>
      <label className={styles.field}>마을 이름<input required maxLength={80} value={name} disabled={rename.isPending} onChange={(event) => setName(event.target.value)} /></label>
      <div className={styles.actions}><Button type="submit" disabled={rename.isPending || !name.trim()}>마을 이름 저장</Button><Button variant="secondary" disabled={rename.isPending} onClick={() => setEditingName(false)}>변경 취소</Button></div>
      {rename.isError && <p role="alert" className={styles.error}>마을 이름을 저장하지 못했어요. 중복된 이름과 이장 권한을 확인해 주세요.</p>}
    </form> : <div><Button variant="secondary" onClick={() => { setName(village.name); rename.reset(); setEditingName(true) }}>마을 이름 변경</Button></div>)}
    <label className={styles.field}>출석 기준 주일<input type="date" value={date} max={calendar.sunday} step={7} min="1970-01-04"
      onChange={(event) => { if (event.target.value) setDate(event.target.value) }} /></label>
    {!sunday && <p role="alert" className={styles.error}>주일 날짜를 선택해 주세요.</p>}
    <div className={styles.columns}>
      <div className={styles.stack}>
        <section className={styles.section} aria-label="마을원 명단">
          <div className={styles.row}><h2>마을원 {members.length}명</h2>
            <label className={styles.check}><input type="checkbox" checked={reveal} onChange={(event) => setReveal(event.target.checked)} />개인정보 마스킹 해제</label>
          </div>
          {admin && <p className={styles.muted}>전체 관리자는 공개 설정과 관계없이 조회할 수 있어요.</p>}
          <ul className={`${styles.card} ${styles.list}`}>
            {members.map((member) => <li key={member.profile_id}>
              <div className={styles.row}><strong>{member.name}</strong>{member.is_leader && <span className={styles.badge}>이장</span>}</div>
              <p className={styles.muted}>{member.gender === null ? '성별 비공개·미입력' : member.gender === 'male' ? '남' : '여'}</p>
              <p className={styles.muted}>생년월일 {member.birth_date ? reveal ? member.birth_date : '••••-••-••' : '비공개·미입력'}</p>
              <p className={styles.muted}>휴대폰 {member.phone ? reveal ? member.phone : '•••-••••-••••' : '비공개·미입력'}</p>
            </li>)}
          </ul>
        </section>
        {sunday && records.isPending && <p role="status">출석 기록을 불러오는 중이에요</p>}
        {sunday && records.isError && <div role="alert">출석 기록을 불러오지 못했어요. <Button onClick={() => void records.refetch()}>출석 다시 불러오기</Button></div>}
        {sunday && records.isSuccess && <VillageAttendance key={date} villageId={village.id} date={date} members={members} attendance={attendance} editable={editable} refresh={refresh} />}
        {(leader || admin) && sunday && <VillageOrders villageId={village.id} date={date} />}
      </div>
      <div className={styles.stack}>
        <VillageBoard kind="post" villageId={village.id} profileId={profile!.id} items={posts} canWrite={leader} refresh={refresh} />
        <VillageBoard kind="prayer" villageId={village.id} profileId={profile!.id} items={prayers} canWrite={active && !!me} refresh={refresh} />
      </div>
    </div>
  </>
}

function VillageOrders({ villageId, date }: { villageId: string; date: string }) {
  const orders = useQuery({ queryKey: ['village', villageId, 'orders', date], queryFn: () => fetchOrderStats(villageId, date) })
  return <section className={styles.section} aria-label="마을 주문 통계">
    <h2>마을 주문 통계</h2>
    <p className={styles.muted}>선택한 주일의 주문 당시 소속 마을 기준이에요. 취소한 주문은 제외해요.</p>
    {orders.isPending && <p role="status">주문 통계를 불러오는 중이에요</p>}
    {orders.isError && <div role="alert">주문 통계를 불러오지 못했어요. <Button onClick={() => void orders.refetch()}>통계 다시 불러오기</Button></div>}
    {orders.isSuccess && <div className={styles.card}>
      <strong>총 {orders.data.reduce((sum, item) => sum + item.quantity, 0)}잔</strong>
      {orders.data.map((item) => <p key={`${item.menu_name}:${JSON.stringify(item.options)}`}>{item.menu_name} · {buildOptionLabel({ ...item.options, quantity: item.quantity })}</p>)}
    </div>}
  </section>
}
