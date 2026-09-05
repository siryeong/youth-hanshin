import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { setAttendance, type Attendance, type AttendanceKind, type VillageMember } from './api'
import styles from './VillagePage.module.css'

export function VillageAttendance({ villageId, date, members, attendance, editable, refresh }: {
  villageId: string; date: string; members: VillageMember[]; attendance: Attendance[]; editable: boolean; refresh: () => Promise<void>
}) {
  const [pending, setPending] = useState<{ id: string; kind: AttendanceKind; present: boolean } | null>(null)
  const save = useMutation({
    mutationFn: ({ id, kind, present }: { id: string; kind: AttendanceKind; present: boolean }) => setAttendance(villageId, id, date, kind, present),
    onSuccess: refresh,
    onSettled: () => setPending(null),
  })
  return <section className={styles.section} aria-label="출석 현황">
    <h2>출석 현황</h2>
    <p className={styles.muted}>{editable ? '예배와 마을모임 출석을 각각 체크해 주세요. 최근 4주만 수정할 수 있어요.' : '출석 기록을 조회하고 있어요.'}</p>
    <ul className={`${styles.card} ${styles.list}`}>
      {members.map((member) => {
        const record = attendance.find((row) => row.profile_id === member.profile_id)
        return <li key={member.profile_id}>
          <strong>{member.name}</strong>
          <div className={styles.actions}>{(['worship', 'meeting'] as const).map((kind) => {
            const label = kind === 'worship' ? '예배' : '마을모임'
            const checked = pending?.id === member.profile_id && pending.kind === kind ? pending.present : record?.[kind] ?? false
            return <label className={styles.check} key={kind}>
              <input type="checkbox" aria-label={`${member.name} ${label}`} checked={checked}
                disabled={!editable || pending !== null}
                onChange={(event) => {
                  const change = { id: member.profile_id, kind, present: event.target.checked }
                  setPending(change)
                  save.mutate(change)
                }} />
              {label} {checked ? '출석' : '결석'}
            </label>
          })}</div>
        </li>
      })}
    </ul>
    {save.isPending && <p role="status">출석을 저장하고 있어요</p>}
    {save.isError && <p role="alert" className={styles.error}>저장하지 못했어요. 이장 권한과 최근 4주 범위를 확인하고 다시 시도해 주세요.</p>}
  </section>
}
