import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { createQueryGroup } from './createQueryGroup'
import { tag } from './tag'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('when creating a new group, always executes the action', async () => {
  const response = Symbol('response')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const action = vi.fn((..._args) => response)
  const args = ['a', 'b']
  const group = createQueryGroup(action, args)

  const query = group.createQuery()

  await vi.runOnlyPendingTimersAsync()

  expect(query.data).toBe(response)
  expect(query.error).toBeUndefined()
  expect(query.errored).toBe(false)
  expect(query.executing).toBe(false)
  expect(query.executed).toBe(true)

  expect(action).toHaveBeenCalledWith(...args)
})

test('additional query to existing group, does not execute the action', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const group = createQueryGroup(action, [])

  // initial query
  group.createQuery()

  await vi.runOnlyPendingTimersAsync()

  expect(action).toHaveBeenCalledOnce()

  for (let i = 0; i < 10; i++) {
    group.createQuery()
  }

  await vi.runOnlyPendingTimersAsync()

  expect(action).toHaveBeenCalledOnce()
})

describe('when action executes successfully', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const group = createQueryGroup(action, args)

    const query = group.createQuery()

    await vi.runOnlyPendingTimersAsync()

    expect(query.data).toBe(response)
    expect(query.error).toBeUndefined()
    expect(query.errored).toBe(false)
    expect(query.executing).toBe(false)
    expect(query.executed).toBe(true)

    expect(action).toHaveBeenCalledWith(...args)
  })

  test('when query adds callbacks, onSuccess is called', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    const onSuccess = vi.fn()
    const onError = vi.fn()

    group.createQuery({ onSuccess, onError })

    await vi.runOnlyPendingTimersAsync()

    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('when action throws an error', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const group = createQueryGroup(action, args)

    const query = group.createQuery()

    await vi.runOnlyPendingTimersAsync()

    expect(query.data).toBe(response)
    expect(query.error).toBeUndefined()
    expect(query.errored).toBe(false)
    expect(query.executing).toBe(false)
    expect(query.executed).toBe(true)

    expect(action).toHaveBeenCalledWith(...args)
  })

  test('when query adds callbacks, onError is called', async () => {
    const error = Symbol('error')
    const action = vi.fn(() => {
      throw error
    })
    const group = createQueryGroup(action, [])

    const onSuccess = vi.fn()
    const onError = vi.fn()

    group.createQuery({ onSuccess, onError })

    await vi.runOnlyPendingTimersAsync()

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })
})

describe('given group with interval', () => {
  test('with single interval of 5, runs every 5ms', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    group.createQuery({ interval: 5 })

    await vi.advanceTimersByTimeAsync(0)

    expect(action).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5)

    expect(action).toHaveBeenCalledTimes(2)
  })

  test('with multiple different intervals, runs at shortest', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    group.createQuery({ interval: 10 })
    group.createQuery({ interval: 5 })
    group.createQuery({ interval: 20 })

    await vi.advanceTimersByTimeAsync(0)

    // initial execution
    expect(action).toHaveBeenCalledTimes(1)

    // shortest is 5, 50ms/5 = 10 times
    await vi.advanceTimersByTimeAsync(50)

    expect(action).toHaveBeenCalledTimes(11)
  })

  describe('and interval is removed', () => {
    test('re-evaluates next interval', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const group = createQueryGroup(action, [])

      group.createQuery({ interval: 10 })
      const willRemove = group.createQuery({ interval: 5 })
      group.createQuery({ interval: 20 })

      await vi.runOnlyPendingTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)

      willRemove.dispose()

      // new shortest is 10, 50ms/10 = 5 times
      await vi.advanceTimersByTimeAsync(51)

      expect(action).toHaveBeenCalledTimes(6)
    })
  })

  describe('and new interval is added', () => {
    test('re-evaluates next interval', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const group = createQueryGroup(action, [])

      group.createQuery({ interval: 20 })

      await vi.runOnlyPendingTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)

      // run without hitting interval
      await vi.advanceTimersByTimeAsync(2)

      // add new, shorter interval
      group.createQuery({ interval: 5 })

      // run for new shortest, not enough to hit previous shortest
      await vi.advanceTimersByTimeAsync(6)

      expect(action).toHaveBeenCalledTimes(2)
    })

    test('with interval less than gap since last execution, runs immediately', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const group = createQueryGroup(action, [])

      group.createQuery({ interval: 20 })

      await vi.runOnlyPendingTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)

      // run without hitting interval
      await vi.advanceTimersByTimeAsync(8)

      // add new, shorter interval
      group.createQuery({ interval: 5 })

      await vi.advanceTimersByTimeAsync(0)

      expect(action).toHaveBeenCalledTimes(2)
    })
  })
})

describe('given group with tags', () => {
  test('can check if it has a tag', async () => {
    const group = createQueryGroup(vi.fn(), [])
    const tag1 = tag()
    const tag2 = tag((value: string) => value)

    expect(group.hasTag(tag1)).toBe(false)

    const query1 = group.createQuery({ tags: [tag1] })
    const query2 = group.createQuery({ tags: [tag2('foo')] })

    // need executed to happen for tag factories
    await vi.advanceTimersByTimeAsync(0)

    expect(group.hasTag(tag1)).toBe(true)
    expect(group.hasTag(tag2('foo'))).toBe(true)
    expect(group.hasTag(tag2('bar'))).toBe(false)

    query1.dispose()

    expect(group.hasTag(tag1)).toBe(false)
    expect(group.hasTag(tag2('foo'))).toBe(true)
    expect(group.hasTag(tag2('bar'))).toBe(false)

    query2.dispose()

    expect(group.hasTag(tag1)).toBe(false)
    expect(group.hasTag(tag2('foo'))).toBe(false)
    expect(group.hasTag(tag2('bar'))).toBe(false)
  })
})

describe('execute', () => {
  test('sets immediate execution', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    group.createQuery()

    await vi.advanceTimersByTimeAsync(0)

    // initial execution
    expect(action).toHaveBeenCalledOnce()

    for (let i = 0; i < 10; i++) {
      vi.resetAllMocks()
      group.execute()

      await vi.advanceTimersByTimeAsync(0)

      expect(action).toHaveBeenCalledOnce()
    }
  })

  test('returns the response', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    const result = await group.execute()

    expect(result).toBe(response)
  })

  test('if an error is thrown, actually throws', async () => {
    const action = vi.fn(() => {
      throw new Error('Expected error')
    })
    const group = createQueryGroup(action, [])

    const response = () => group.execute()

    await expect(response).rejects.toThrow('Expected error')
  })
})

describe('retries', () => {
  test('retries the action', async () => {
    const action = vi.fn(() => {
      throw new Error('Expected error')
    })
    const group = createQueryGroup(action, [])

    const result = group.createQuery({ retries: { count: 1, delay: 100 } })

    await vi.advanceTimersByTimeAsync(0)

    expect(action).toHaveBeenCalledTimes(1)
    expect(result.error).toBeUndefined()
    expect(result.errored).toBe(false)
    expect(result.executed).toBe(false)

    await vi.advanceTimersByTimeAsync(100)

    expect(action).toHaveBeenCalledTimes(2)
    expect(result.error).toBeDefined()
    expect(result.errored).toBe(true)
    expect(result.executed).toBe(true)
  })
})
