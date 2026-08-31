import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

test('누르면 onClick 을 부른다', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>담기</Button>)
  await userEvent.click(screen.getByRole('button', { name: '담기' }))
  expect(onClick).toHaveBeenCalledOnce()
})

test('disabled 면 눌러도 부르지 않는다', async () => {
  const onClick = vi.fn()
  render(<Button disabled onClick={onClick}>담기</Button>)
  await userEvent.click(screen.getByRole('button', { name: '담기' }))
  expect(onClick).not.toHaveBeenCalled()
})
