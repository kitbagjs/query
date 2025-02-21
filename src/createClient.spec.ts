import { test, expect, vi, describe, afterEach } from 'vitest'
import { createClient } from './createClient'
import { flushPromises } from '@vue/test-utils'
import { timeout } from './utils'
import { nextTick, ref } from 'vue'

afterEach(() => {
  vi.useRealTimers()
})

describe('query', () => {
  test('multiple queries with the same action only executes the action once', async () => {
    const action = vi.fn()
    const { query } = createClient()

    query(action, [])
    query(action, [])
    query(action, [])

    await flushPromises()

    expect(action).toHaveBeenCalledOnce()
  })

  test.fails('using a query automatically disposes of the query', () => {
    const action = vi.fn(() => true)
    const { query } = createClient()

    async function test() {
      using value = await query(action, [])

      return value.response
    }

    test()

    query(action, [])

    expect(action).toHaveBeenCalledTimes(2)
  })

  test('response is set after action is executed', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { query } = createClient()
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

    const { query } = createClient()
    const value = query(action, [])

    expect(value.response).toBeUndefined()

    await value

    expect(value.response).toBe(response)
  })

  test('awaiting a query throws an error if the action throws an error', async () => {
    const action = vi.fn(() => { throw new Error('test') })
    const { query } = createClient()
    const value = query(action, [])

    await expect(value).rejects.toThrow('test')
  })

  test('onSuccess', async () => {
    const action = vi.fn()
    const onSuccess = vi.fn()
    const { query } = createClient()

    query(action, [], { onSuccess })

    await flushPromises()

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  test('onError', async () => {
    const action = vi.fn(() => { throw new Error('test') })
    const onError = vi.fn()
    const { query } = createClient()

    query(action, [], { onError })

    await flushPromises()

    expect(onError).toHaveBeenCalledOnce()
  })
})

describe('useQuery', () => {
  test('responds to parameter changes', async () => {
    const responseTrue = Symbol('responseTrue')
    const responseFalse = Symbol('responseFalse')

    const action = vi.fn((value: boolean) => value ? responseTrue : responseFalse)
    const { useQuery } = createClient()

    const input = ref(false)

    const query = useQuery(action, () => [input.value])

    expect(query.response).toBe(undefined)

    await nextTick()

    expect(query.response).toBe(responseFalse)

    input.value = true

    await nextTick()

    expect(query.response).toBe(responseTrue)
  })

  test('awaiting a query returns the response', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { useQuery } = createClient()

    const query = await useQuery(action, [])

    expect(query.response).toBe(response)
  })

  test('awaiting a query throws an error if the action throws an error', async () => {
    const action = vi.fn(() => { throw new Error('test') })
    const { useQuery } = createClient()
    const value = useQuery(action, [])
  
    await expect(value).rejects.toThrow('test')
  })

  test('changing parameters preserves previous response', async () => {
    vi.useFakeTimers()
    const responseTrue = Symbol('responseTrue')
    const responseFalse = Symbol('responseFalse')
    const input = ref<boolean | null>(false)

    const action = vi.fn(async (value: boolean) => {
      await timeout(100)
      return value ? responseTrue : responseFalse
    })

    const { useQuery } = createClient()

    const query = useQuery(action, () => {
      if(input.value === null) {
        return null
      }

      return [input.value]
    })

    expect(query.response).toBeUndefined()

    vi.runAllTimers()
    await flushPromises()

    expect(query.response).toBe(responseFalse)

    input.value = true

    await nextTick()

    expect(query.response).toBe(responseFalse)

    vi.runAllTimers()
    await flushPromises()

    expect(query.response).toBe(responseTrue)

    input.value = true

    await nextTick()

    expect(query.response).toBe(responseTrue)

    input.value = null

    await nextTick()

    expect(query.response).toBeUndefined()
  })

  test('queries do not interfere with each other', async () => {
    const action1 = vi.fn(() => true)
    const action2 = vi.fn(() => false)
    const { useQuery } = createClient()

    const query1 = useQuery(action1, [])
    const query2 = useQuery(action2, [])

    await flushPromises()

    expect(query1.response).toBe(true)
    expect(query2.response).toBe(false)
  })
})

describe('defineQuery', () => {
  test('returns a defined query function', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createClient()

    const { query } = defineQuery(action)

    const value = await query([])

    expect(value.response).toBe(response)
  })

  test('returns a defined query composition', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createClient()

    const { useQuery } = defineQuery(action)

    const value = await useQuery([])

    expect(value.response).toBe(response)
  })
})