import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { createQueryGroup } from "./createQueryGroup"
import { tag } from "./tag"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('subscribing to new group, always executes the action', async () => {
  const response = Symbol('response')
  const action = vi.fn((..._args) => response)
  const args = ['a', 'b']
  const group = createQueryGroup(action, args)

  const query = group.subscribe()

  await vi.runOnlyPendingTimersAsync()

  expect(query.response).toBe(response)
  expect(query.error).toBeUndefined()
  expect(query.errored).toBe(false)
  expect(query.executing).toBe(false)
  expect(query.executed).toBe(true)

  expect(action).toHaveBeenCalledWith(...args)
})

test('additional subscription to existing group, does not execute the action', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const group = createQueryGroup(action, [])

  // initial subscription
  group.subscribe()

  await vi.runOnlyPendingTimersAsync()
  
  expect(action).toHaveBeenCalledOnce()

  for(let i = 0; i < 10; i++) {
    group.subscribe()
  }

  await vi.runOnlyPendingTimersAsync()

  expect(action).toHaveBeenCalledOnce()
})

describe('when action executes successfully', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const group = createQueryGroup(action, args)

    const query = group.subscribe()

    await vi.runOnlyPendingTimersAsync()

    expect(query.response).toBe(response)
    expect(query.error).toBeUndefined()
    expect(query.errored).toBe(false)
    expect(query.executing).toBe(false)
    expect(query.executed).toBe(true)

    expect(action).toHaveBeenCalledWith(...args)
  })

  test('when subscriptions add callbacks, onSuccess is called', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])
  
    const onSuccess = vi.fn()
    const onError = vi.fn()
  
    group.subscribe({ onSuccess, onError })
  
    await vi.runOnlyPendingTimersAsync()
    
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('when action throws an error', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const group = createQueryGroup(action, args)

    const query = group.subscribe()

    await vi.runOnlyPendingTimersAsync()

    expect(query.response).toBe(response)
    expect(query.error).toBeUndefined()
    expect(query.errored).toBe(false)
    expect(query.executing).toBe(false)
    expect(query.executed).toBe(true)

    expect(action).toHaveBeenCalledWith(...args)
  })
  
  test('when subscriptions add callbacks, onError is called', async () => {
    const error = Symbol('error')
    const action = vi.fn(() => { throw error })
    const group = createQueryGroup(action, [])

    const onSuccess = vi.fn()
    const onError = vi.fn()

    group.subscribe({ onSuccess, onError })

    await vi.runOnlyPendingTimersAsync()
    
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })
})

test('active property is true whenever there are 1+ subscriptions', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const group = createQueryGroup(action, [])

  const first = group.subscribe()

  await vi.runOnlyPendingTimersAsync()

  expect(group.active).toBe(true)
  
  const second = group.subscribe()

  await vi.runOnlyPendingTimersAsync()

  expect(group.active).toBe(true)

  first.dispose()

  expect(group.active).toBe(true)

  second.dispose()

  expect(group.active).toBe(false)
})

describe('given group with interval', () => {
  test('with single interval of 5, runs every 5ms', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    group.subscribe({ interval: 5 })

    await vi.advanceTimersByTimeAsync(0)

    expect(action).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5)

    expect(action).toHaveBeenCalledTimes(2)
  })

  test('with multiple different intervals, runs at shortest', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const group = createQueryGroup(action, [])

    group.subscribe({ interval: 10 })
    group.subscribe({ interval: 5 })
    group.subscribe({ interval: 20 })

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

      group.subscribe({ interval: 10 })
      const willRemove = group.subscribe({ interval: 5 })
      group.subscribe({ interval: 20 })

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

      group.subscribe({ interval: 20 })

      await vi.runOnlyPendingTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)

      // run without hitting interval
      await vi.advanceTimersByTimeAsync(2)

      // add new, shorter interval
      group.subscribe({ interval: 5 })

      // run for new shortest, not enough to hit previous shortest
      await vi.advanceTimersByTimeAsync(6)

      expect(action).toHaveBeenCalledTimes(2)
    })

    test('with interval less than gap since last execution, runs immediately', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const group = createQueryGroup(action, [])

      group.subscribe({ interval: 20 })

      await vi.runOnlyPendingTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)
      
      // run without hitting interval
      await vi.advanceTimersByTimeAsync(8)

      // add new, shorter interval
      group.subscribe({ interval: 5 })

      await vi.advanceTimersByTimeAsync(0)

      expect(action).toHaveBeenCalledTimes(2)
    })
  })
})

describe('given group with tags', () => {
  test('can check if it has a tag', () => {
    const group = createQueryGroup(vi.fn(), [])
    const tag1 = tag('tag1')
    const tag2 = tag('tag2', (value: string) => value)

    expect(group.hasTag(tag1)).toBe(false)

    const query1 = group.subscribe({ tags: [tag1] })
    const query2 = group.subscribe({ tags: [tag1, tag2('foo')] })

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