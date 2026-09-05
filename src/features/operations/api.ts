import { supabase } from '../../lib/supabase'
import type { Profile, ProfileInput } from '../auth/api'
import type { CartLine, Menu } from '../cafe/api'
import type { Calendar } from '../village/api'

export type RosterMember = Pick<Profile, 'id' | 'name' | 'gender' | 'birth_date' | 'phone' | 'role' | 'last_seen_at'> & {
  created_at: string; has_account: boolean; is_dormant: boolean
}
export type Cohort = { id: string; name: string; year: number; is_active: boolean }
export type Assignment = { cohort_id: string; profile_id: string; village_id: string | null; is_leader: boolean }
export type ManagedVillage = { id: string; name: string; cohort_id: string }
export type Directory = { members: RosterMember[]; cohorts: Cohort[]; villages: ManagedVillage[]; assignments: Assignment[]; calendar: Calendar }
export type ManagedMenu = Menu & { price: number; ice_price_delta: number; is_active: boolean }
export type CafeSettings = { weekday: number; opens_at: string; closes_at: string }
export type Closure = { closed_on: string; reason: string | null }
export type CafeOrder = {
  item_id: string; order_id: string; village_id: string | null; village_name: string; profile_id: string | null;
  person_name: string; menu_name: string; options: CartLine['options']; quantity: number; status: 'ordered' | 'cancelled'; ordered_at: string
}
export type Announcement = { id: string; author_id: string | null; title: string; body: string; created_at: string }

export async function fetchDirectory(): Promise<Directory> {
  const [members, cohorts, villages, assignments, calendar] = await Promise.all([
    supabase.from('roster_v2').select('*').order('name'),
    supabase.from('cohorts_v2').select('id, name, year, is_active').order('year', { ascending: false }),
    supabase.from('villages_v2').select('id, name, cohort_id').order('name'),
    supabase.from('village_members_v2').select('cohort_id, profile_id, village_id, is_leader'),
    supabase.rpc('village_calendar_v2'),
  ])
  for (const result of [members, cohorts, villages, assignments, calendar]) if (result.error) throw result.error
  return { members: members.data as RosterMember[], cohorts: cohorts.data as Cohort[], villages: villages.data as ManagedVillage[],
    assignments: assignments.data as Assignment[], calendar: calendar.data as Calendar }
}

export async function saveMember(id: string | null, input: Pick<ProfileInput, 'name' | 'gender' | 'birth_date' | 'phone'>) {
  const { error } = await supabase.rpc('save_roster_member_v2', {
    p_id: id, p_name: input.name.trim(), p_gender: input.gender, p_birth_date: input.birth_date, p_phone: input.phone,
  })
  if (error) throw error
}

export async function deleteMember(id: string) {
  const { error } = await supabase.rpc('delete_roster_member_v2', { p_id: id })
  if (error) throw error
}

export async function setRole(id: string, role: 'staff' | 'youth') {
  const { error } = await supabase.rpc('set_member_role_v2', { p_id: id, p_role: role })
  if (error) throw error
}

export async function createCohort(name: string, year: number) {
  const { data, error } = await supabase.rpc('create_cohort_v2', { p_name: name.trim(), p_year: year })
  if (error) throw error
  return data as string
}

export async function createVillage(cohortId: string, name: string) {
  const { error } = await supabase.rpc('create_village_v2', { p_cohort_id: cohortId, p_name: name.trim() })
  if (error) throw error
}

export async function deleteVillage(id: string) {
  const { error } = await supabase.rpc('delete_village_v2', { p_village_id: id })
  if (error) throw error
}

export async function assignMembers(cohortId: string, ids: string[], villageId: string | null) {
  const { error } = await supabase.rpc('assign_members_v2', { p_cohort_id: cohortId, p_profile_ids: ids, p_village_id: villageId })
  if (error) throw error
}

export async function setLeader(cohortId: string, profileId: string, leader: boolean) {
  const { error } = await supabase.rpc('set_village_leader_v2', { p_cohort_id: cohortId, p_profile_id: profileId, p_is_leader: leader })
  if (error) throw error
}

export async function fetchCafeOrders(cohortId: string | null, date: string): Promise<CafeOrder[]> {
  const { data, error } = await supabase.rpc('cafe_orders_v2', { p_cohort_id: cohortId, p_service_date: date })
  if (error) throw error
  return data as CafeOrder[]
}

export async function fetchCafeManagement() {
  const [menus, settings, closures] = await Promise.all([
    supabase.from('menus_v2').select('*').order('category').order('sort_order'),
    supabase.from('cafe_settings_v2').select('weekday, opens_at, closes_at').maybeSingle(),
    supabase.from('cafe_closures_v2').select('closed_on, reason').order('closed_on', { ascending: false }),
  ])
  for (const result of [menus, settings, closures]) if (result.error) throw result.error
  return { menus: menus.data as ManagedMenu[], settings: settings.data as CafeSettings | null, closures: closures.data as Closure[] }
}

export async function saveMenu(id: string | null, input: Omit<ManagedMenu, 'id'>) {
  const query = id ? supabase.from('menus_v2').update(input).eq('id', id) : supabase.from('menus_v2').insert(input)
  const { error } = await query.select('id').single()
  if (error) throw error
}

export async function deleteMenu(id: string) {
  const { error } = await supabase.from('menus_v2').delete().eq('id', id).select('id').single()
  if (error) throw error
}

export async function saveCafeSettings(settings: CafeSettings) {
  const { error } = await supabase.from('cafe_settings_v2').upsert({ id: true, ...settings }).select('id').single()
  if (error) throw error
}

export async function saveClosure(closure: Closure) {
  const { error } = await supabase.from('cafe_closures_v2').upsert(closure).select('closed_on').single()
  if (error) throw error
}

export async function deleteClosure(date: string) {
  const { error } = await supabase.from('cafe_closures_v2').delete().eq('closed_on', date).select('closed_on').single()
  if (error) throw error
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase.from('announcements_v2').select('id, author_id, title, body, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return data as Announcement[]
}

export async function saveAnnouncement(title: string, body: string, id?: string) {
  const input = { title: title.trim(), body: body.trim() }
  const query = id ? supabase.from('announcements_v2').update(input).eq('id', id) : supabase.from('announcements_v2').insert(input)
  const { error } = await query.select('id').single()
  if (error) throw error
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements_v2').delete().eq('id', id).select('id').single()
  if (error) throw error
}
