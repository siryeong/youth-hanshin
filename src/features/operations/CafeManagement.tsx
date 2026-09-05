import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import type { MenuCategory, MenuOptions } from '../cafe/api'
import { deleteClosure, deleteMenu, fetchCafeManagement, saveCafeSettings, saveClosure, saveMenu, type CafeSettings, type Closure, type ManagedMenu } from './api'
import { useOperation } from './useOperations'
import styles from './OperationsPage.module.css'

export function CafeManagement() {
  const management = useQuery({ queryKey: ['operations', 'cafe'], queryFn: fetchCafeManagement, refetchInterval: 30_000 })
  const [editing, setEditing] = useState<ManagedMenu | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const remove = useOperation(deleteMenu, () => setDeleting(null))
  if (management.isPending) return <p role="status">카페 설정을 불러오는 중이에요</p>
  if (management.isError) return <div role="alert">카페 설정을 불러오지 못했어요. <Button onClick={() => void management.refetch()}>카페 설정 다시 불러오기</Button></div>
  const { menus, settings, closures } = management.data
  return <div className={styles.stack}>
    <SettingsForm key={JSON.stringify(settings)} settings={settings} />
    <ClosureForm closures={closures} />
    <section className={styles.stack}>
      <div className={styles.row}><h3>메뉴 관리</h3><Button onClick={() => setEditing('new')}>메뉴 추가</Button></div>
      <p className={styles.muted}>가격은 관리자만 조회해요. 삭제한 메뉴의 과거 주문은 주문 당시 이름과 옵션으로 남아요.</p>
      {editing && <MenuForm key={editing === 'new' ? 'new' : editing.id} menu={editing === 'new' ? null : editing} close={() => setEditing(null)} />}
      <ul className={`${styles.card} ${styles.list}`}>{menus.map((menu) => <li key={menu.id}>
        <div className={styles.row}><strong>{menu.name}</strong><span>{menu.is_active ? '판매 중' : '판매 중지'}</span></div>
        <p>{menu.price.toLocaleString('ko-KR')}원 · ICE 추가 {menu.ice_price_delta.toLocaleString('ko-KR')}원</p>
        <div className={styles.actions}><Button variant="secondary" ariaLabel={`${menu.name} 메뉴 수정`} onClick={() => setEditing(menu)}>메뉴 수정</Button>
          {deleting === menu.id ? <><span>{menu.name} 메뉴를 삭제할까요?</span><Button disabled={remove.isPending} onClick={() => remove.mutate(menu.id)}>메뉴 삭제 확인</Button><Button variant="secondary" disabled={remove.isPending} onClick={() => setDeleting(null)}>삭제 취소</Button></>
            : <Button variant="secondary" ariaLabel={`${menu.name} 메뉴 삭제`} onClick={() => { remove.reset(); setDeleting(menu.id) }}>메뉴 삭제</Button>}
        </div>
        {deleting === menu.id && remove.isError && <p role="alert" className={styles.error}>삭제하지 못했어요. 다시 시도해 주세요.</p>}
      </li>)}</ul>
      {!menus.length && <p className={styles.card}>메뉴를 추가해 주세요.</p>}
    </section>
  </div>
}

function SettingsForm({ settings }: { settings: CafeSettings | null }) {
  const [weekday, setWeekday] = useState(settings?.weekday ?? 7)
  const [opensAt, setOpensAt] = useState(settings?.opens_at.slice(0, 5) ?? '10:00')
  const [closesAt, setClosesAt] = useState(settings?.closes_at.slice(0, 5) ?? '14:30')
  const save = useOperation(() => saveCafeSettings({ weekday, opens_at: opensAt, closes_at: closesAt }))
  const valid = opensAt !== '' && closesAt !== '' && opensAt < closesAt
  return <form className={styles.card} onSubmit={(event) => { event.preventDefault(); if (valid) save.mutate() }}>
    <h3>주문 가능 시간</h3>
    <fieldset className={styles.fields} disabled={save.isPending}>
      <label className={styles.field}>주문 요일<select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>{['월', '화', '수', '목', '금', '토', '일'].map((day, index) => <option value={index + 1} key={day}>{day}요일</option>)}</select></label>
      <label className={styles.field}>시작 시각<input type="time" required value={opensAt} onChange={(event) => setOpensAt(event.target.value)} /></label>
      <label className={styles.field}>마감 시각<input type="time" required value={closesAt} onChange={(event) => setClosesAt(event.target.value)} /></label>
    </fieldset>
    <p className={styles.muted}>한국 시간 기준이에요. 마감 시각부터 주문과 취소를 모두 막아요.</p>
    {!valid && <p role="alert" className={styles.error}>마감 시각은 시작 시각보다 늦어야 해요.</p>}
    {save.isError && <p role="alert" className={styles.error}>운영 시간을 저장하지 못했어요. 다시 시도해 주세요.</p>}
    {save.isSuccess && <p role="status">운영 시간을 저장했어요.</p>}
    <div><Button type="submit" disabled={save.isPending || !valid}>운영 시간 저장</Button></div>
  </form>
}

function ClosureForm({ closures }: { closures: Closure[] }) {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }))
  const [reason, setReason] = useState('')
  const save = useOperation(() => saveClosure({ closed_on: date, reason: reason.trim() || null }), () => setReason(''))
  const remove = useOperation(deleteClosure)
  return <section className={styles.card}>
    <h3>임시 휴무</h3>
    <form onSubmit={(event) => { event.preventDefault(); save.mutate() }} className={styles.form}>
      <label className={styles.field}>휴무 날짜<input type="date" required value={date} disabled={save.isPending || remove.isPending} onChange={(event) => setDate(event.target.value)} /></label>
      <label className={styles.field}>휴무 사유<input maxLength={200} value={reason} disabled={save.isPending || remove.isPending} onChange={(event) => setReason(event.target.value)} /></label>
      <div><Button type="submit" disabled={!date || save.isPending || remove.isPending}>임시 휴무 저장</Button></div>
    </form>
    {(save.isError || remove.isError) && <p role="alert" className={styles.error}>휴무 설정을 변경하지 못했어요. 다시 시도해 주세요.</p>}
    {save.isSuccess && <p role="status">임시 휴무를 저장했어요.</p>}
    <ul className={styles.list}>{closures.map((closure) => <li key={closure.closed_on}><div className={styles.row}><span>{closure.closed_on} · {closure.reason || '임시 휴무'}</span><Button variant="secondary" ariaLabel={`${closure.closed_on} 휴무 해제`} disabled={save.isPending || remove.isPending} onClick={() => remove.mutate(closure.closed_on)}>휴무 해제</Button></div></li>)}</ul>
  </section>
}

function MenuForm({ menu, close }: { menu: ManagedMenu | null; close: () => void }) {
  const [name, setName] = useState(menu?.name ?? '')
  const [category, setCategory] = useState<MenuCategory>(menu?.category ?? 'coffee')
  const [price, setPrice] = useState(menu?.price ?? 0)
  const [iceDelta, setIceDelta] = useState(menu?.ice_price_delta ?? 0)
  const [active, setActive] = useState(menu?.is_active ?? true)
  const [sort, setSort] = useState(menu?.sort_order ?? 0)
  const [options, setOptions] = useState<MenuOptions>(menu?.options ?? { temperature: ['hot', 'ice'], shot: 0, light: false, syrup: false })
  const save = useOperation(() => saveMenu(menu?.id ?? null, { name: name.trim(), category, price, ice_price_delta: iceDelta, is_active: active, sort_order: sort, options }), close)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim() && options.temperature.length) save.mutate() }
  return <form className={styles.card} onSubmit={submit} aria-label="메뉴 편집">
    <fieldset className={styles.stack} disabled={save.isPending}>
      <div className={styles.fields}>
        <label className={styles.field}>메뉴 이름<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className={styles.field}>카테고리<select value={category} onChange={(event) => setCategory(event.target.value as MenuCategory)}><option value="coffee">커피</option><option value="non_coffee">차·논커피</option><option value="cold">음료</option></select></label>
        <label className={styles.field}>가격<input type="number" required min={0} max={2147483647} value={price} onChange={(event) => setPrice(Number(event.target.value))} /></label>
        <label className={styles.field}>ICE 추가금<input type="number" required min={0} max={2147483647} value={iceDelta} onChange={(event) => setIceDelta(Number(event.target.value))} /></label>
        <label className={styles.field}>정렬 순서<input type="number" required min={0} max={2147483647} value={sort} onChange={(event) => setSort(Number(event.target.value))} /></label>
        <label className={styles.field}>샷 추가 최대<input type="number" required min={0} max={9} value={options.shot} onChange={(event) => setOptions({ ...options, shot: Number(event.target.value) })} /></label>
      </div>
      <div className={styles.actions}>{(['hot', 'ice'] as const).map((temperature) => <label className={styles.check} key={temperature}><input type="checkbox" checked={options.temperature.includes(temperature)} onChange={(event) => setOptions({ ...options, temperature: event.target.checked ? [...options.temperature, temperature] : options.temperature.filter((value) => value !== temperature) })} />{temperature.toUpperCase()} 가능</label>)}</div>
      <div className={styles.actions}>
        <label className={styles.check}><input type="checkbox" checked={options.light} onChange={(event) => setOptions({ ...options, light: event.target.checked })} />연하게 가능</label>
        <label className={styles.check}><input type="checkbox" checked={options.syrup} onChange={(event) => setOptions({ ...options, syrup: event.target.checked })} />시럽 추가 가능</label>
        <label className={styles.check}><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />판매 중</label>
      </div>
    </fieldset>
    {!options.temperature.length && <p role="alert" className={styles.error}>온도를 하나 이상 선택해 주세요.</p>}
    {save.isError && <p role="alert" className={styles.error}>메뉴를 저장하지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.</p>}
    <div className={styles.actions}><Button type="submit" disabled={save.isPending || !name.trim() || !options.temperature.length}>메뉴 저장</Button><Button variant="secondary" disabled={save.isPending} onClick={close}>편집 취소</Button></div>
  </form>
}
