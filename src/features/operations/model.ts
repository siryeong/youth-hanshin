import type { RosterMember, CafeOrder } from './api'

export function ageOn(birthDate: string | null, today: string): number | null {
  if (!birthDate) return null
  return Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4)) - Number(today.slice(5) < birthDate.slice(5))
}

export function demographics(members: RosterMember[], today: string) {
  const ages = members.map((member) => ageOn(member.birth_date, today)).filter((age) => age !== null)
  return { male: members.filter((member) => member.gender === 'male').length,
    female: members.filter((member) => member.gender === 'female').length,
    unknown: members.filter((member) => member.gender === null).length,
    average: ages.length ? (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1) : null }
}

export function sortMembers(members: RosterMember[], sort: string) {
  return [...members].sort((a, b) => {
    if (sort === 'age') return (a.birth_date ?? '9999').localeCompare(b.birth_date ?? '9999') || a.name.localeCompare(b.name, 'ko')
    if (sort === 'gender') return (a.gender ?? 'z').localeCompare(b.gender ?? 'z') || a.name.localeCompare(b.name, 'ko')
    return a.name.localeCompare(b.name, 'ko')
  })
}

export function summarizeOrders(orders: CafeOrder[]) {
  const groups = new Map<string, Pick<CafeOrder, 'village_id' | 'village_name' | 'menu_name' | 'options' | 'quantity'>>()
  for (const item of orders) {
    if (item.status !== 'ordered') continue
    const { temperature, shot, light, syrup } = item.options
    const key = JSON.stringify([item.village_id, item.menu_name, temperature, shot, light, syrup])
    const group = groups.get(key)
    if (group) group.quantity += item.quantity
    else groups.set(key, { village_id: item.village_id, village_name: item.village_name, menu_name: item.menu_name, options: item.options, quantity: item.quantity })
  }
  return [...groups.values()]
}
