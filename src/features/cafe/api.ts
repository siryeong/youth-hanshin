import { supabase } from '../../lib/supabase'

export type MenuCategory = 'coffee' | 'non_coffee' | 'cold'
export type MenuOptions = { temperature: ('ice' | 'hot')[]; shot: number; light: boolean; syrup: boolean }
export type Menu = { id: string; category: MenuCategory; name: string; options: MenuOptions; sort_order: number }

export type CartLine = {
  menu_id: string
  menu_name: string
  option_label: string
  options: { temperature: 'ice' | 'hot'; shot: number; light: boolean; syrup: boolean }
  quantity: number
}

export type GuestOrderItem = {
  item_id: string
  menu_name: string
  option_label: string
  quantity: number
  status: 'ordered' | 'cancelled'
  ordered_at: string
}

export type MemberOrderItem = GuestOrderItem & {
  service_date: string
  cohort_id: string | null
  cohort_name: string
}

type MemberOrder = {
  service_date: string
  cohort_id: string | null
  cohorts_v2: { name: string; year: number } | null
  order_items_v2: (Omit<GuestOrderItem, 'item_id' | 'ordered_at'> & { id: string; created_at: string })[]
}

export type CafeStatus = {
  is_open: boolean
  opens_at: string
  closes_at: string
  closes_in_seconds: number
  is_closed_today: boolean
  today_isodow: number
  server_time: string
}

export async function fetchMenus(): Promise<Menu[]> {
  const { data, error } = await supabase.from('menus_public_v2').select('*').order('sort_order')
  if (error) throw error
  return data as Menu[]
}

export async function fetchCafeStatus(): Promise<CafeStatus> {
  const { data, error } = await supabase.rpc('cafe_status')
  if (error) throw error
  return data as CafeStatus
}

export async function placeOrder(items: CartLine[], guestToken: string | null): Promise<string> {
  const { data, error } = await supabase.rpc('place_order', { p_items: items, p_guest_token: guestToken })
  if (error) throw error
  return data as string
}

export async function fetchGuestOrders(guestToken: string): Promise<GuestOrderItem[]> {
  const { data, error } = await supabase.rpc('get_guest_orders', { p_guest_token: guestToken })
  if (error) throw error
  return (data ?? []) as GuestOrderItem[]
}

export async function fetchMemberOrders(): Promise<MemberOrderItem[]> {
  const { data, error } = await supabase.from('orders_v2')
    .select('service_date, cohort_id, cohorts_v2(name, year), order_items_v2(id, menu_name, option_label, quantity, status, created_at)')
    .order('service_date', { ascending: false }).order('created_at', { ascending: false })
    .overrideTypes<MemberOrder[], { merge: false }>()
  if (error) throw error
  return data.flatMap((order) => order.order_items_v2.map((item) => ({
    item_id: item.id, menu_name: item.menu_name, option_label: item.option_label,
    quantity: item.quantity, status: item.status, ordered_at: item.created_at,
    service_date: order.service_date, cohort_id: order.cohort_id,
    cohort_name: order.cohorts_v2 ? `${order.cohorts_v2.year}년 ${order.cohorts_v2.name}` : '기수 미지정',
  })))
}

export async function cancelOrderItem(itemId: string, guestToken: string | null): Promise<void> {
  const { error } = await supabase.rpc('cancel_order_item', { p_item_id: itemId, p_guest_token: guestToken })
  if (error) throw error
}
