import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { roleLabels } from '../auth/api'
import { useAuth } from '../auth/useAuth'
import { deleteMember, saveMember, setRole, type RosterMember } from './api'
import { ageOn, sortMembers } from './model'
import { useDirectory, useOperation } from './useOperations'
import styles from './OperationsPage.module.css'

export function RosterPage() {
  const directory = useDirectory()
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('name')
  const [reveal, setReveal] = useState(false)
  const [editing, setEditing] = useState<RosterMember | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const remove = useOperation(deleteMember, () => setDeleting(null))
  const role = useOperation(({ id, value }: { id: string; value: 'staff' | 'youth' }) => setRole(id, value))
  if (directory.isPending) return <p role="status">전체 명단을 불러오는 중이에요</p>
  if (directory.isError) return <div role="alert">명단을 불러오지 못했어요. <Button onClick={() => void directory.refetch()}>명단 다시 불러오기</Button></div>
  const { members, cohorts, assignments, villages, calendar } = directory.data
  const active = cohorts.find((cohort) => cohort.is_active)
  const visible = sortMembers(members.filter((member) => member.name.includes(search.trim()) && (filter !== 'dormant' || member.is_dormant)), sort)
  return <section className={styles.stack}>
    <div className={styles.row}><h2>전체 명단 {members.length}명</h2><Button onClick={() => setEditing('new')}>인원 등록</Button></div>
    <p className={styles.muted}>장기 미접속 {members.filter((member) => member.is_dormant).length}명 · 1년 이상 접속하지 않은 인원도 명단과 마을 배정을 유지해요.</p>
    <div className={styles.fields}>
      <label className={styles.field}>이름 검색<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className={styles.field}>접속 상태<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">전체 인원</option><option value="dormant">장기 미접속</option></select></label>
      <label className={styles.field}>명단 정렬<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">이름순</option><option value="age">나이순 · 많은 순</option><option value="gender">성별순</option></select></label>
      <label className={styles.check}><input type="checkbox" checked={reveal} onChange={(event) => { setReveal(event.target.checked); if (editing !== 'new') setEditing(null) }} />개인정보 마스킹 해제</label>
    </div>
    <p className={styles.muted}>프로필을 수정하려면 마스킹을 해제해 주세요. 임원 역할은 목회자만 지정·해제할 수 있어요.</p>
    {editing && <MemberForm key={editing === 'new' ? 'new' : editing.id} member={editing === 'new' ? null : editing} today={calendar.today} close={() => setEditing(null)} />}
    {role.isError && <p role="alert" className={styles.error}>역할을 변경하지 못했어요. 목회자 권한을 확인하고 다시 시도해 주세요.</p>}
    {role.isSuccess && <p role="status">역할을 변경했어요.</p>}
    <ul className={`${styles.card} ${styles.list}`}>
      {visible.map((member) => {
        const assignment = assignments.find((item) => item.cohort_id === active?.id && item.profile_id === member.id)
        const village = villages.find((item) => item.id === assignment?.village_id)
        const age = ageOn(member.birth_date, calendar.today)
        return <li key={member.id}>
          <div className={styles.row}>
            <div className={styles.actions}><strong>{member.name}</strong><span>{village?.name ?? '미배정'}</span>{member.is_dormant && <span className={styles.badge}>장기 미접속</span>}{assignment?.is_leader && <span className={styles.badge}>이장</span>}</div>
            <span className={styles.muted}>{member.gender === 'male' ? '남' : member.gender === 'female' ? '여' : '성별 미상'} · {age === null ? '나이 미상' : `${age}세`}</span>
          </div>
          <p className={styles.muted}>생년월일 {member.birth_date ? reveal ? member.birth_date : '••••-••-••' : '미입력'} · 휴대폰 {member.phone ? reveal ? member.phone : '•••-••••-••••' : '미입력'}</p>
          <p className={styles.muted}>{member.has_account ? '카카오 가입' : '명단 직접 등록'} · 마지막 접속 {member.last_seen_at ? new Date(member.last_seen_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) : '기록 없음'}</p>
          <div className={styles.actions}>
            <Button variant="secondary" ariaLabel={`${member.name} 정보 수정`} disabled={!reveal} onClick={() => setEditing(member)}>정보 수정</Button>
            {member.role === 'admin' || member.role === 'pastor' ? <span>{roleLabels[member.role]}</span> : <label className={styles.field}>{member.name} 역할<select value={role.isPending && role.variables.id === member.id ? role.variables.value : member.role} disabled={profile?.role !== 'pastor' || !member.has_account || role.isPending}
              onChange={(event) => role.mutate({ id: member.id, value: event.target.value as 'staff' | 'youth' })}><option value="youth">청년</option><option value="staff">임원</option></select></label>}
            {!member.has_account && !member.is_dormant && (deleting === member.id ? <>
              <span>직접 등록한 {member.name}의 명단·출석·배정을 삭제할까요?</span>
              <Button disabled={remove.isPending} onClick={() => remove.mutate(member.id)}>명단 삭제 확인</Button>
              <Button variant="secondary" disabled={remove.isPending} onClick={() => setDeleting(null)}>삭제 취소</Button>
            </> : <Button variant="secondary" ariaLabel={`${member.name} 명단 삭제`} onClick={() => { remove.reset(); setDeleting(member.id) }}>명단 삭제</Button>)}
          </div>
          {deleting === member.id && remove.isError && <p role="alert" className={styles.error}>삭제하지 못했어요. 다시 시도해 주세요.</p>}
        </li>
      })}
      {!visible.length && <li>조건에 맞는 인원이 없어요.</li>}
    </ul>
  </section>
}

function MemberForm({ member, today, close }: { member: RosterMember | null; today: string; close: () => void }) {
  const [name, setName] = useState(member?.name ?? '')
  const [gender, setGender] = useState(member?.gender ?? '')
  const [birthDate, setBirthDate] = useState(member?.birth_date ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const save = useOperation(() => saveMember(member?.id ?? null, { name, gender: gender ? gender as 'male' | 'female' : null, birth_date: birthDate || null, phone: phone.replace(/[-\s]/g, '') || null }), close)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim()) save.mutate() }
  return <form className={styles.card} onSubmit={submit} aria-label={member ? '인원 수정' : '인원 등록'}>
    <h3>{member ? `${member.name} 정보 수정` : '인원 등록'}</h3>
    {!member && <p className={styles.muted}>아직 가입하지 않은 인원을 명단에 등록해요. 카카오 계정은 만들거나 자동으로 연결하지 않아요.</p>}
    <fieldset disabled={save.isPending} className={styles.fields}>
      <label className={styles.field}>이름<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className={styles.field}>성별<select value={gender} onChange={(event) => setGender(event.target.value)}><option value="">미입력</option><option value="male">남</option><option value="female">여</option></select></label>
      <label className={styles.field}>생년월일<input type="date" max={today} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
      <label className={styles.field}>휴대폰번호<input type="tel" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" maxLength={13} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
    </fieldset>
    {save.isError && <p role="alert" className={styles.error}>저장하지 못했어요. 입력한 정보를 확인하고 다시 시도해 주세요.</p>}
    <div className={styles.actions}><Button type="submit" disabled={save.isPending || !name.trim()}>명단 저장</Button><Button variant="secondary" disabled={save.isPending} onClick={close}>수정 취소</Button></div>
  </form>
}
