import { render, screen } from '@testing-library/react'
import { App } from './App'

test('주문 화면 제목을 보여준다', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '청년부 카페' })).toBeInTheDocument()
})
