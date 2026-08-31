import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

test('최댓값에서는 더 늘리지 않는다', async () => {
  const onChange = vi.fn()
  render(<Stepper label="샷 추가" value={2} min={0} max={2} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '샷 추가 늘리기' }))
  expect(onChange).not.toHaveBeenCalled()
})

test('최솟값 위에서는 줄인다', async () => {
  const onChange = vi.fn()
  render(<Stepper label="수량" value={2} min={1} max={9} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: '수량 줄이기' }))
  expect(onChange).toHaveBeenCalledWith(1)
})
