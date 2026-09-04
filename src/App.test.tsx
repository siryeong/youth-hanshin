import { screen } from '@testing-library/react'
import { App } from './App'
import { renderWithQuery } from './test/renderWithQuery'

test('주문 화면 제목을 보여준다', () => {
  renderWithQuery(<App />)
  expect(screen.getByRole('heading', { name: '청년부 카페' })).toBeInTheDocument()
})
