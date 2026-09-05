import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../auth/useAuth'
import { assignMembers, createCohort, createVillage, deleteVillage, setLeader, type Cohort, type Directory } from './api'
import { ageOn, demographics, sortMembers } from './model'
import { useDirectory, useOperation } from './useOperations'
import styles from './OperationsPage.module.css'

export function AssignmentPage() {
  const directory = useDirectory()
  const [selected, setSelected] = useState('')
  const [creating, setCreating] = useState(false)
  if (directory.isPending) return <p role="status">편성 정보를 불러오는 중이에요</p>
  if (directory.isError) return <div role="alert">편성 정보를 불러오지 못했어요. <Button onClick={() => void directory.refetch()}>편성 다시 불러오기</Button></div>
  const { cohorts } = directory.data
  const cohort = cohorts.find((item) => item.id === selected) ?? cohorts.find((item) => item.is_active) ?? cohorts[0]
  return <section className={styles.stack}>
    <div className={styles.row}><h2>마을 편성</h2><Button onClick={() => setCreating(true)}>새 기수 만들기</Button></div>
    {creating && <CohortForm nextYear={Math.max(Number(directory.data.calendar.today.slice(0, 4)), ...cohorts.map((item) => item.year + 1))} selectCohort={setSelected} close={() => setCreating(false)} />}
    {cohort ? <>
      <label className={styles.field}>편성 기수<select value={cohort.id} onChange={(event) => setSelected(event.target.value)}>{cohorts.map((item) => <option key={item.id} value={item.id}>{item.year}년 {item.name}{item.is_active ? ' · 현재 기수' : ' · 지난 기수'}</option>)}</select></label>
      <AssignmentBoard key={`${cohort.id}:${cohort.is_active}`} directory={directory.data} cohort={cohort} />
    </> : <p className={styles.card}>새 기수를 만든 뒤 마을을 생성하고 인원을 배정해 주세요.</p>}
  </section>
}

function CohortForm({ nextYear, selectCohort, close }: { nextYear: number; selectCohort: (id: string) => void; close: () => void }) {
  const [name, setName] = useState('')
  const [year, setYear] = useState(nextYear)
  const [confirmed, setConfirmed] = useState(false)
  const create = useOperation(async () => selectCohort(await createCohort(name, year)), close)
  return <form className={styles.card} onSubmit={(event) => { event.preventDefault(); if (confirmed && name.trim()) create.mutate() }}>
    <div className={styles.fields}>
      <label className={styles.field}>기수 이름<input required maxLength={80} value={name} disabled={create.isPending} onChange={(event) => setName(event.target.value)} /></label>
      <label className={styles.field}>기수 연도<input type="number" required min={nextYear} max={9999} value={year} disabled={create.isPending} onChange={(event) => setYear(Number(event.target.value))} /></label>
    </div>
    <p>새 기수가 현재 기수로 바뀌며, 기존 기수는 조회 전용으로 보관해요. 장기 미접속자를 포함한 전체 인원을 미배정 상태로 가져와요.</p>
    <label className={styles.check}><input type="checkbox" checked={confirmed} disabled={create.isPending} onChange={(event) => setConfirmed(event.target.checked)} />기수 전환을 확인했어요</label>
    {create.isError && <p role="alert" className={styles.error}>기수를 만들지 못했어요. 기존 기수보다 이후 연도인지 확인해 주세요.</p>}
    <div className={styles.actions}><Button type="submit" disabled={create.isPending || !confirmed || !name.trim()}>기수 생성·전환</Button><Button variant="secondary" disabled={create.isPending} onClick={close}>생성 취소</Button></div>
  </form>
}

function AssignmentBoard({ directory, cohort }: { directory: Directory; cohort: Cohort }) {
  const { profile } = useAuth()
  const [selected, setSelected] = useState<string[]>([])
  const [sort, setSort] = useState('age')
  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [pendingLeader, setPendingLeader] = useState<{ id: string; value: boolean } | null>(null)
  const move = useOperation(({ ids, villageId }: { ids: string[]; villageId: string | null }) => assignMembers(cohort.id, ids, villageId), () => { setSelected([]); setMessage('인원을 이동했어요. 이동한 이장의 이장 지정은 해제돼요.') })
  const leader = useOperation(({ id, value }: { id: string; value: boolean }) => setLeader(cohort.id, id, value))
  const create = useOperation(() => createVillage(cohort.id, name), () => setName(''))
  const remove = useOperation(deleteVillage, () => setDeleting(null))
  const busy = move.isPending || pendingLeader !== null || create.isPending || remove.isPending
  const assignments = directory.assignments.filter((item) => item.cohort_id === cohort.id)
  const members = sortMembers(directory.members.filter((member) => cohort.is_active || assignments.some((item) => item.profile_id === member.id)), sort)
  const villages = directory.villages.filter((item) => item.cohort_id === cohort.id)
  const groups = [{ id: '', name: '미배정' }, ...villages]
  const submitVillage = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim()) create.mutate() }
  return <>
    <p className={styles.muted}>{cohort.is_active ? '인원을 선택하고 [여기로 이동]을 누르거나, 인원 카드를 마을로 드래그해 주세요. 이장 지정·해제는 목회자만 할 수 있어요.' : '지난 기수는 조회만 할 수 있어요.'}</p>
    <label className={styles.field}>편성 정렬<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="age">나이순 · 많은 순</option><option value="gender">성별순</option><option value="name">이름순</option></select></label>
    <form className={styles.card} onSubmit={submitVillage}>
      <label className={styles.field}>새 마을 이름<input required maxLength={80} value={name} disabled={!cohort.is_active || busy} onChange={(event) => setName(event.target.value)} /></label>
      <div><Button type="submit" disabled={!cohort.is_active || busy || !name.trim()}>마을 생성</Button></div>
      {create.isError && <p role="alert" className={styles.error}>마을을 만들지 못했어요. 중복된 이름과 현재 기수를 확인해 주세요.</p>}
    </form>
    <div className={styles.row}><span>{selected.length}명 선택</span><Button variant="secondary" disabled={!selected.length || busy} onClick={() => setSelected([])}>선택 해제</Button></div>
    {message && <p role="status">{message}</p>}
    {move.isError && <p role="alert" className={styles.error}>이동하지 못했어요. 선택은 유지돼요. 현재 기수와 권한을 확인하고 다시 시도해 주세요.</p>}
    {leader.isError && <p role="alert" className={styles.error}>이장 지정을 변경하지 못했어요. 목회자 권한과 마을 배정을 확인해 주세요.</p>}
    <div className={styles.board}>
      {groups.map((group) => {
        const people = members.filter((member) => (assignments.find((item) => item.profile_id === member.id)?.village_id ?? '') === group.id)
        const stats = demographics(people, directory.calendar.today)
        return <section key={group.id} aria-label={`${group.name} 편성`} className={`${styles.card} ${over === group.id ? styles.drop : ''}`}
          onDragOver={(event) => { if (cohort.is_active && !busy && event.dataTransfer.types.includes('application/x-village-member')) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setOver(group.id) } }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(null) }}
          onDrop={(event) => {
            event.preventDefault(); setOver(null)
            const id = event.dataTransfer.getData('application/x-village-member')
            if (cohort.is_active && !busy && people.every((person) => person.id !== id) && members.some((member) => member.id === id)) move.mutate({ ids: [id], villageId: group.id || null })
          }}>
          <div className={styles.row}><h3>{group.name}</h3><strong>{people.length}명</strong></div>
          <p className={styles.muted}>남 {stats.male} · 여 {stats.female} · 성별 미상 {stats.unknown} · 평균 {stats.average === null ? '미상' : `${stats.average}세`}</p>
          <Button variant="secondary" ariaLabel={`${group.name} 여기로 이동`} disabled={!cohort.is_active || busy || !selected.some((id) => !people.some((person) => person.id === id))}
            onClick={() => move.mutate({ ids: selected.filter((id) => !people.some((person) => person.id === id)), villageId: group.id || null })}>여기로 이동</Button>
          {people.map((member) => {
            const assigned = assignments.find((item) => item.profile_id === member.id)
            const age = ageOn(member.birth_date, directory.calendar.today)
            return <div className={styles.person} key={member.id} data-selected={selected.includes(member.id)} draggable={cohort.is_active && !busy}
              onDragStart={(event) => { event.dataTransfer.setData('application/x-village-member', member.id); event.dataTransfer.effectAllowed = 'move' }} onDragEnd={() => setOver(null)}>
              <label className={styles.check}><input type="checkbox" aria-label={`${member.name} 선택`} checked={selected.includes(member.id)} disabled={!cohort.is_active || busy}
                onChange={(event) => setSelected(event.target.checked ? [...selected, member.id] : selected.filter((id) => id !== member.id))} /><strong>{member.name}</strong>{member.is_dormant && <span className={styles.badge}>장기 미접속</span>}</label>
              <span className={styles.muted}>{member.gender === 'male' ? '남' : member.gender === 'female' ? '여' : '성별 미상'} · {age === null ? '나이 미상' : `${age}세`}</span>
              <label className={styles.check}><input type="checkbox" aria-label={`${member.name} 이장`} checked={pendingLeader?.id === member.id ? pendingLeader.value : assigned?.is_leader ?? false} disabled={!cohort.is_active || !group.id || profile?.role !== 'pastor' || busy}
                onChange={(event) => {
                  const change = { id: member.id, value: event.target.checked }
                  setPendingLeader(change)
                  leader.mutate(change, { onSettled: () => setPendingLeader(null) })
                }} />이장</label>
            </div>
          })}
          {!people.length && <p className={styles.muted}>배정된 인원이 없어요.</p>}
          {group.id && (deleting === group.id ? <>
            <p>이 마을을 삭제하고 인원을 미배정으로 옮길까요? 출석·소식·주문 기록이 있는 마을은 삭제할 수 없어요.</p>
            <Button disabled={busy} onClick={() => remove.mutate(group.id)}>마을 삭제 확인</Button><Button variant="secondary" disabled={busy} onClick={() => setDeleting(null)}>삭제 취소</Button>
            {remove.isError && <p role="alert" className={styles.error}>삭제하지 못했어요. 마을 기록이 있거나 현재 기수가 아닐 수 있어요.</p>}
          </> : <Button variant="secondary" ariaLabel={`${group.name} 마을 삭제`} disabled={!cohort.is_active || busy} onClick={() => { remove.reset(); setDeleting(group.id) }}>마을 삭제</Button>)}
        </section>
      })}
    </div>
  </>
}
