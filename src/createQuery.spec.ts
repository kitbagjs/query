import { test, expect, vi } from 'vitest'
import { createQuery } from './createQuery'

test('works', () => {
  const action = vi.fn()
  const { query } = createQuery()

  query(action, [])
  query(action, [])
  query(action, [])

  expect(action).toHaveBeenCalledOnce()
})