import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryTabs } from './CategoryTabs'

test('세 카테고리를 보여주고 현재 탭을 표시한다', () => {
  render(<CategoryTabs value="non_coffee" onChange={() => {}} />)
  expect(screen.getByRole('tab', { name: '커피' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByRole('tab', { name: '논커피' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: '음료' })).toHaveAttribute('aria-selected', 'false')
})

test('탭을 누르면 그 카테고리로 onChange 를 부른다', async () => {
  const onChange = vi.fn()
  render(<CategoryTabs value="coffee" onChange={onChange} />)
  await userEvent.click(screen.getByRole('tab', { name: '음료' }))
  expect(onChange).toHaveBeenCalledWith('cold')
})
