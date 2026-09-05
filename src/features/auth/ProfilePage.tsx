import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { roleLabels, signOut, updateProfile, type Profile, type ProfileInput } from './api'
import { useAuth } from './useAuth'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  return <ProfileForm key={profile.id} profile={profile} />
}

function ProfileForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name)
  const [gender, setGender] = useState<NonNullable<Profile['gender']> | ''>(profile.gender ?? '')
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [showGender, setShowGender] = useState(profile.show_gender)
  const [showBirthDate, setShowBirthDate] = useState(profile.show_birth_date)
  const [showPhone, setShowPhone] = useState(profile.show_phone)
  const { refreshProfile } = useAuth()
  const save = useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(profile.id, input),
    onSuccess: refreshProfile,
  })
  const logout = useMutation({ mutationFn: signOut })
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    save.mutate({
      name: name.trim(), gender: gender === '' ? null : gender,
      birth_date: birthDate || null, phone: phone.replace(/[-\s]/g, '') || null,
      show_gender: showGender, show_birth_date: showBirthDate, show_phone: showPhone,
    })
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}><h1>내 정보</h1><ThemeToggle /></header>
      <div className={styles.identity}><strong>{profile.name}</strong><span className={styles.badge}>{roleLabels[profile.role]}</span></div>
      <form onSubmit={submit} className={styles.form}>
        <fieldset className={styles.group} disabled={save.isPending || logout.isPending}>
          <legend>프로필</legend>
          <label className={styles.field}>이름<input autoComplete="name" required maxLength={80} pattern=".*\S.*" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <div className={styles.field}><label htmlFor="profile-gender">성별</label><select id="profile-gender" value={gender} onChange={(event) => setGender(event.target.value as typeof gender)}><option value="">선택 안 함</option><option value="male">남</option><option value="female">여</option></select></div>
          <label className={styles.field}>생년월일<input type="date" autoComplete="bday" max={today} value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label>
          <label className={styles.field}>휴대폰번호<input type="tel" autoComplete="tel" placeholder="010-1234-5678" pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}" maxLength={13} title="010-1234-5678 형식으로 입력해 주세요" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <p className={styles.note}>생년월일과 휴대폰번호는 비워 둘 수 있어요.</p>
        </fieldset>
        <fieldset className={styles.group} disabled={save.isPending || logout.isPending}>
          <legend>공개 설정</legend>
          <label className={styles.toggle}>성별 공개<input type="checkbox" checked={showGender} onChange={(event) => setShowGender(event.target.checked)} /></label>
          <label className={styles.toggle}>생년월일 공개<input type="checkbox" checked={showBirthDate} onChange={(event) => setShowBirthDate(event.target.checked)} /></label>
          <label className={styles.toggle}>휴대폰번호 공개<input type="checkbox" checked={showPhone} onChange={(event) => setShowPhone(event.target.checked)} /></label>
          <p className={styles.note}>공개하면 마을원에게 보여요. 기본값은 비공개이며, 시스템 관리자·목회자·임원은 공개 설정과 관계없이 조회할 수 있어요.</p>
        </fieldset>
        {save.isError && <p role="alert">저장하지 못했어요. 입력한 정보를 확인하고 다시 시도해 주세요.</p>}
        {save.isSuccess && <p role="status">저장했어요</p>}
        <Button type="submit" size="lg" disabled={save.isPending || logout.isPending}>{save.isPending ? '저장하고 있어요' : '저장하기'}</Button>
      </form>
      {profile.last_seen_at && <p className={styles.note}>마지막 로그인 {new Date(profile.last_seen_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>}
      <Button variant="secondary" disabled={save.isPending || logout.isPending} onClick={() => logout.mutate()}>로그아웃</Button>
      {logout.isError && <p role="alert">로그아웃하지 못했어요. 다시 시도해 주세요.</p>}
    </main>
  )
}
