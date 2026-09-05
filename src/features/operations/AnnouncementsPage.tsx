import { Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { MessageBoard } from '../../components/MessageBoard'
import { useAuth } from '../auth/useAuth'
import { deleteAnnouncement, fetchAnnouncements, saveAnnouncement } from './api'
import styles from '../village/VillagePage.module.css'

export function AnnouncementsPage() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  return <Announcements />
}

function Announcements() {
  const { profile } = useAuth()
  const client = useQueryClient()
  const news = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements, refetchInterval: 30_000 })
  return <main className={styles.page}>
    <header className={styles.header}><h1>청년부 소식</h1><ThemeToggle /></header>
    <p className={styles.muted}>로그인한 모든 청년부원이 볼 수 있어요.</p>
    {news.isPending && <p role="status">소식을 불러오는 중이에요</p>}
    {news.isError && <div role="alert">소식을 불러오지 못했어요. <Button onClick={() => void news.refetch()}>소식 다시 불러오기</Button></div>}
    {news.isSuccess && <MessageBoard label="전체 소식" withTitle profileId={profile!.id} items={news.data} canWrite={profile!.role !== 'youth'} canManageAll
      saveItem={saveAnnouncement} deleteItem={deleteAnnouncement} refresh={() => client.invalidateQueries({ queryKey: ['announcements'] })} />}
  </main>
}
