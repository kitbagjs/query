import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { createChannel } from "./createChannel"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('subscribing to new channel, always executes the action', async () => {
  const response = Symbol('response')
  const action = vi.fn((..._args) => response)
  const args = ['a', 'b']
  const channel = createChannel(action, args)

  const query = channel.subscribe()

  await vi.runAllTimersAsync()

  expect(query.response).toBe(response)
  expect(query.error).toBeUndefined()
  expect(query.errored).toBe(false)
  expect(query.executing).toBe(false)
  expect(query.executed).toBe(true)

  expect(action).toHaveBeenCalledWith(...args)
})

test('additional subscription to existing channel, does not execute the action', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const channel = createChannel(action, [])

  // initial subscription
  channel.subscribe()

  await vi.runAllTimersAsync()
  
  expect(action).toHaveBeenCalledOnce()

  for(let i = 0; i < 10; i++) {
    channel.subscribe()
  }

  await vi.runAllTimersAsync()

  expect(action).toHaveBeenCalledOnce()
})

describe('when action executes successfully', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const channel = createChannel(action, args)

    const query = channel.subscribe()

    await vi.runAllTimersAsync()

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
    const channel = createChannel(action, [])
  
    const onSuccess = vi.fn()
    const onError = vi.fn()
  
    channel.subscribe({ onSuccess, onError })
  
    await vi.runAllTimersAsync()
    
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('when action throws an error', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const channel = createChannel(action, args)

    const query = channel.subscribe()

    await vi.runAllTimersAsync()

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
    const channel = createChannel(action, [])

    const onSuccess = vi.fn()
    const onError = vi.fn()

    channel.subscribe({ onSuccess, onError })

    await vi.runAllTimersAsync()
    
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })
})

test('active property is true whenever there are 1+ subscriptions', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const channel = createChannel(action, [])

  const first = channel.subscribe()

  await vi.runAllTimersAsync()

  expect(channel.active).toBe(true)
  
  const second = channel.subscribe()

  await vi.runAllTimersAsync()

  expect(channel.active).toBe(true)

  first.dispose()

  expect(channel.active).toBe(true)

  second.dispose()

  expect(channel.active).toBe(false)
})

describe('given channel with interval', () => {
  test('with single interval of 5, runs every 5ms', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const channel = createChannel(action, [])

    channel.subscribe({ interval: 5 })

    await vi.advanceTimersByTimeAsync(0)

    expect(action).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5)

    expect(action).toHaveBeenCalledTimes(2)
  })

  test.only('with multiple different intervals, runs at shortest', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const channel = createChannel(action, [])

    channel.subscribe({ interval: 10 })
    channel.subscribe({ interval: 5 })
    channel.subscribe({ interval: 20 })

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
      const channel = createChannel(action, [])

      channel.subscribe({ interval: 10 })
      const willRemove = channel.subscribe({ interval: 5 })
      channel.subscribe({ interval: 20 })

      await vi.runAllTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)

      willRemove.dispose()

      // new shortest is 10, 50ms/10 = 5 times
      await vi.advanceTimersByTimeAsync(51)

      expect(action).toHaveBeenCalledTimes(5)
    })
  })

  describe('and new interval is added', () => {
    test('re-evaluates next interval', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const channel = createChannel(action, [])

      channel.subscribe({ interval: 20 })

      await vi.runAllTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)

      // run without hitting interval
      await vi.advanceTimersByTimeAsync(2)

      // add new, shorter interval
      channel.subscribe({ interval: 5 })

      // run for new shortest, not enough to hit previous shortest
      await vi.advanceTimersByTimeAsync(6)

      expect(action).toHaveBeenCalledTimes(2)
    })

    test('with interval less than gap since last execution, runs immediately', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const channel = createChannel(action, [])

      channel.subscribe({ interval: 20 })

      await vi.runAllTimersAsync()

      // initial execution
      expect(action).toHaveBeenCalledTimes(1)
      
      // run without hitting interval, longer than 5ms
      await vi.advanceTimersByTimeAsync(8)

      // add new, shorter interval
      channel.subscribe({ interval: 5 })

      // run for new shortest, not enough to hit previous shortest
      await vi.advanceTimersByTimeAsync(5)

      expect(action).toHaveBeenCalledTimes(2)
    })
  })
})
