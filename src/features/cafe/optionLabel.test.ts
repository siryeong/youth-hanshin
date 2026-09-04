import { expect, test } from 'vitest'
import { buildOptionLabel } from './optionLabel'

test('고른 옵션만 순서대로 잇는다', () => {
  expect(buildOptionLabel({ temperature: 'ice', shot: 1, light: true, syrup: false, quantity: 2 }))
    .toBe('ICE · 샷 1 · 연하게 · 2잔')
})

test('고르지 않은 옵션은 빼고 온도와 수량은 항상 넣는다', () => {
  expect(buildOptionLabel({ temperature: 'hot', shot: 0, light: false, syrup: false, quantity: 1 }))
    .toBe('HOT · 1잔')
})

test('모든 옵션을 고르면 정해진 순서로 잇는다', () => {
  expect(buildOptionLabel({ temperature: 'hot', shot: 2, light: true, syrup: true, quantity: 3 }))
    .toBe('HOT · 샷 2 · 연하게 · 시럽 · 3잔')
})
