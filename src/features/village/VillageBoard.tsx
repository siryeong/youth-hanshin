import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { deletePost, deletePrayer, savePost, savePrayer, type Prayer, type VillagePost } from './api'
import styles from './VillagePage.module.css'

export function VillageBoard({ kind, villageId, profileId, items, canWrite, refresh }: {
  kind: 'post' | 'prayer'; villageId: string; profileId: string; items: (VillagePost | Prayer)[]; canWrite: boolean; refresh: () => Promise<void>
}) {
  const inputId = useId()
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const label = kind === 'post' ? '마을 소식' : '기도제목'
  const save = useMutation({
    mutationFn: () => kind === 'post' ? savePost(villageId, title, body, editing || undefined) : savePrayer(villageId, body, editing || undefined),
    onSuccess: async () => { setEditing(null); await refresh() },
  })
  const remove = useMutation({
    mutationFn: (id: string) => kind === 'post' ? deletePost(id) : deletePrayer(id),
    onSuccess: async () => { setDeleting(null); await refresh() },
  })
  const startEdit = (item?: VillagePost | Prayer) => {
    save.reset()
    setTitle(item && 'title' in item ? item.title : '')
    setBody(item?.body ?? '')
    setEditing(item?.id ?? '')
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (body.trim() && (kind !== 'post' || title.trim())) save.mutate()
  }

  return <section className={styles.section} aria-label={label}>
    <div className={styles.row}><h2>{label}</h2>
      {canWrite && editing === null && <Button variant="secondary" onClick={() => startEdit()}>{label} 올리기</Button>}
    </div>
    {kind === 'prayer' && <p className={styles.muted}>우리 마을과 전체 관리자가 볼 수 있어요.</p>}
    {editing !== null && canWrite && <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
      {kind === 'post' && <label className={styles.field}>소식 제목<input required maxLength={120} value={title} disabled={save.isPending} onChange={(event) => setTitle(event.target.value)} /></label>}
      <div className={styles.field}><label htmlFor={inputId}>{label} 내용</label><textarea id={inputId} required maxLength={5000} value={body} disabled={save.isPending} onChange={(event) => setBody(event.target.value)} /></div>
      {save.isError && <p role="alert" className={styles.error}>저장하지 못했어요. 입력한 내용은 유지돼요. 다시 시도해 주세요.</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={save.isPending || !body.trim() || (kind === 'post' && !title.trim())}>{save.isPending ? '저장하고 있어요' : `${label} 저장`}</Button>
        <Button variant="secondary" disabled={save.isPending} onClick={() => setEditing(null)}>작성 취소</Button>
      </div>
    </form>}
    {items.length === 0 && <p className={`${styles.card} ${styles.muted}`}>아직 올라온 {label}이 없어요.</p>}
    {items.map((item) => <article className={styles.card} key={item.id}>
      {'title' in item && <h3 className={styles.body}>{item.title}</h3>}
      <p className={styles.body}>{item.body}</p>
      <p className={styles.muted}>{item.author_id === profileId ? '내가 올린 글' : item.author_name} · {new Date(item.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
      {canWrite && (kind === 'post' || item.author_id === profileId) && <div className={styles.actions}>
        {deleting === item.id ? <>
          <span>이 글을 삭제할까요?</span>
          <Button disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>삭제 확인</Button>
          <Button variant="secondary" disabled={remove.isPending} onClick={() => setDeleting(null)}>삭제 취소</Button>
        </> : <>
          <Button variant="secondary" ariaLabel={`${label} 수정: ${'title' in item ? item.title : item.body}`} disabled={save.isPending} onClick={() => startEdit(item)}>수정</Button>
          <Button variant="secondary" ariaLabel={`${label} 삭제: ${'title' in item ? item.title : item.body}`} onClick={() => { remove.reset(); setDeleting(item.id) }}>삭제</Button>
        </>}
        {deleting === item.id && remove.isError && <p role="alert" className={styles.error}>삭제하지 못했어요. 다시 시도해 주세요.</p>}
      </div>}
    </article>)}
  </section>
}
