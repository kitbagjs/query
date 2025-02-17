import { test, expect, vi, describe } from 'vitest'
import { createQuery } from './createQuery'
import { flushPromises } from '@vue/test-utils'
import { timeout } from './utils'

test('multiple queries with the same action only executes the action once', async () => {
  const action = vi.fn()
  const { query } = createQuery()

  query(action, [])
  query(action, [])
  query(action, [])

  await flushPromises()

  expect(action).toHaveBeenCalledOnce()
})

test('using a query automatically disposes of the query', () => {
  const action = vi.fn()
  const { query } = createQuery()

  function test() {
    using value = query(action, [])

    return value.response
  }

  test()

  query(action, [])

  expect(action).toHaveBeenCalledTimes(2)
})

test('response is set after action is executed', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const { query } = createQuery()
  const value = query(action, [])

  expect(value.response).toBeUndefined()

  await flushPromises()

  expect(value.response).toBe(response)
})

test('awaiting a query returns the response', async () => {
  const response = Symbol('response')
  const action = vi.fn(async () => {
    await timeout(100)
    return response
  })

  const { query } = createQuery()
  const value = query(action, [])

  expect(value.response).toBeUndefined()

  await value

  expect(value.response).toBe(response)
})

test('awaiting a query throws an error if the action throws an error', async () => {
  const action = vi.fn(() => { throw new Error('test') })
  const { query } = createQuery()
  const value = query(action, [])

  await expect(value).rejects.toThrow('test')
})

test('onSuccess', async () => {
  const action = vi.fn()
  const onSuccess = vi.fn()
  const { query } = createQuery()

  query(action, [], { onSuccess })

  await flushPromises()

  expect(onSuccess).toHaveBeenCalledOnce()
})

test('onError', async () => {
  const action = vi.fn(() => { throw new Error('test') })
  const onError = vi.fn()
  const { query } = createQuery()

  query(action, [], { onError })

  await flushPromises()

  expect(onError).toHaveBeenCalledOnce()
})

describe('defineQuery', () => {
  test('returns a defined query', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createQuery()

    const { query } = defineQuery(action)

    const value = await query([])

    expect(value.response).toBe(response)
  })
})