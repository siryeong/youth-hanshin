import { supabase } from '../../lib/supabase'

export type Village = {
  id: string
  name: string
  cohort_id: string
  cohorts_v2: { name: string; year: number; is_active: boolean }
}
export type VillageMember = {
  profile_id: string
  name: string
  is_leader: boolean
  gender: 'male' | 'female' | null
  birth_date: string | null
  phone: string | null
}
export type Attendance = { profile_id: string; service_date: string; worship: boolean; meeting: boolean }
export type AttendanceKind = 'worship' | 'meeting'
export type VillagePost = { id: string; author_id: string; author_name: string; title: string; body: string; created_at: string }
export type Prayer = Omit<VillagePost, 'title'>
export type Calendar = { today: string; sunday: string; editable_from: string }
export type OrderStat = { menu_name: string; options: { temperature: 'ice' | 'hot'; shot: number; light: boolean; syrup: boolean }; quantity: number }

export async function fetchVillages() {
  const [villages, calendar] = await Promise.all([
    supabase.from('villages_v2').select('id, name, cohort_id, cohorts_v2(name, year, is_active)').order('name')
      .overrideTypes<Village[], { merge: false }>(),
    supabase.rpc('village_calendar_v2'),
  ])
  if (villages.error) throw villages.error
  if (calendar.error) throw calendar.error
  return {
    villages: villages.data.sort((a, b) => Number(b.cohorts_v2.is_active) - Number(a.cohorts_v2.is_active)
      || b.cohorts_v2.year - a.cohorts_v2.year || a.name.localeCompare(b.name, 'ko')),
    calendar: calendar.data as Calendar,
  }
}

export async function fetchVillage(id: string) {
  const [members, posts, prayers] = await Promise.all([
    supabase.from('village_members_public_v2').select('profile_id, name, is_leader, gender, birth_date, phone').eq('village_id', id).order('name'),
    supabase.from('village_posts_public_v2').select('id, author_id, author_name, title, body, created_at').eq('village_id', id).order('created_at', { ascending: false }),
    supabase.from('prayer_requests_public_v2').select('id, author_id, author_name, body, created_at').eq('village_id', id).order('created_at', { ascending: false }),
  ])
  for (const result of [members, posts, prayers]) if (result.error) throw result.error
  return { members: members.data as VillageMember[],
    posts: posts.data as VillagePost[], prayers: prayers.data as Prayer[] }
}

export async function fetchAttendance(id: string, date: string): Promise<Attendance[]> {
  const { data, error } = await supabase.from('attendance_v2').select('profile_id, service_date, worship, meeting').eq('village_id', id).eq('service_date', date)
  if (error) throw error
  return data as Attendance[]
}

export async function renameVillage(id: string, name: string) {
  const { error } = await supabase.from('villages_v2').update({ name: name.trim() }).eq('id', id).select('id').single()
  if (error) throw error
}

export async function setAttendance(villageId: string, profileId: string, date: string, kind: AttendanceKind, present: boolean) {
  const { error } = await supabase.rpc('set_village_attendance_v2', {
    p_village_id: villageId, p_profile_id: profileId, p_service_date: date, p_kind: kind, p_present: present,
  })
  if (error) throw error
}

export async function savePost(villageId: string, title: string, body: string, id?: string) {
  const input = { title: title.trim(), body: body.trim() }
  const query = id ? supabase.from('village_posts_v2').update(input).eq('id', id)
    : supabase.from('village_posts_v2').insert({ village_id: villageId, ...input })
  const { error } = await query.select('id').single()
  if (error) throw error
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('village_posts_v2').delete().eq('id', id).select('id').single()
  if (error) throw error
}

export async function savePrayer(villageId: string, body: string, id?: string) {
  const input = { body: body.trim() }
  const query = id ? supabase.from('prayer_requests_v2').update(input).eq('id', id)
    : supabase.from('prayer_requests_v2').insert({ village_id: villageId, ...input })
  const { error } = await query.select('id').single()
  if (error) throw error
}

export async function deletePrayer(id: string) {
  const { error } = await supabase.from('prayer_requests_v2').delete().eq('id', id).select('id').single()
  if (error) throw error
}

export async function fetchOrderStats(villageId: string, date: string): Promise<OrderStat[]> {
  const { data, error } = await supabase.rpc('village_order_stats_v2', { p_village_id: villageId, p_service_date: date })
  if (error) throw error
  return data as OrderStat[]
}
