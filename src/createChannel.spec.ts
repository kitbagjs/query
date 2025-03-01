import { describe, expect, test, vi } from "vitest"
import { createChannel } from "./createChannel"
import { flushPromises } from "@vue/test-utils"

test('subscribing to new channel, always executes the action', async () => {
  const response = Symbol('response')
  const action = vi.fn((..._args) => response)
  const args = ['a', 'b']
  const channel = createChannel(action, args)

  const query = channel.subscribe()

  await flushPromises()

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

  await flushPromises()
  
  expect(action).toHaveBeenCalledOnce()

  for(let i = 0; i < 10; i++) {
    channel.subscribe()
  }

  await flushPromises()

  expect(action).toHaveBeenCalledOnce()
})

describe('when action executes successfully', () => {
  test('properties are set correctly', async () => {
    const response = Symbol('response')
    const action = vi.fn((..._args) => response)
    const args = ['a', 'b']
    const channel = createChannel(action, args)

    const query = channel.subscribe()

    await flushPromises()

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
  
    await flushPromises()
    
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

    await flushPromises()

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

    await flushPromises()
    
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })
})

test('active property is true whenever there are 1+ subscriptions', async () => {
  const response = Symbol('response')
  const action = vi.fn(() => response)
  const channel = createChannel(action, [])

  const first = channel.subscribe()

  await flushPromises()

  expect(channel.active).toBe(true)
  
  const second = channel.subscribe()

  await flushPromises()

  expect(channel.active).toBe(true)

  first.dispose()

  expect(channel.active).toBe(true)

  second.dispose()

  expect(channel.active).toBe(false)
})