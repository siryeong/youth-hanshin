export type Selection = { temperature: 'ice' | 'hot'; shot: number; light: boolean; syrup: boolean; quantity: number }

export function buildOptionLabel(s: Selection): string {
  const parts: string[] = [s.temperature.toUpperCase()]
  if (s.shot > 0) parts.push(`샷 ${s.shot}`)
  if (s.light) parts.push('연하게')
  if (s.syrup) parts.push('시럽')
  parts.push(`${s.quantity}잔`)
  return parts.join(' · ')
}
