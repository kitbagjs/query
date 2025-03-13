import { test, expect, vi, describe, afterEach, beforeEach } from 'vitest'
import { createClient } from './createClient'
import { effectScope, ref } from 'vue'
import { timeout } from './utilities/timeout'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function testInEffectScope(name: string, fn: () => Promise<void>) {
  test(name, async () => {
    const scope = effectScope()
    await scope.run(fn)
    scope.stop()
  })
}

describe('query', () => {
  test('multiple queries with the same action only executes the action once', async () => {
    const action = vi.fn()
    const { query } = createClient()

    query(action, [])
    query(action, [])
    query(action, [])

    await vi.runOnlyPendingTimersAsync()

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

    await vi.runOnlyPendingTimersAsync()

    expect(value.response).toBe(response)
  })

  test.each([
    [new Error('test')],
    ['test'],
    [1],
    [true],
    [false],
    [null],
    [undefined],
  ])('error is set after action throws: %s', async (error) => {
    const action = vi.fn(() => { throw error })
    const { query } = createClient()
    const value = query(action, [])

    await vi.runOnlyPendingTimersAsync()

    expect(value.error).toBe(error)
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

    await vi.runAllTimersAsync()

    expect(value.response).toBe(response)
  })

  test.each([
    [new Error('test')],
    ['test'],
    [1],
    [true],
    [false],
    [null],
    [undefined],
  ])('awaiting a query throws an error if the action throws: %s', async (error) => {
    const action = vi.fn(() => { throw error })
    const { query } = createClient()
    const value = query(action, [])

    await vi.runOnlyPendingTimersAsync()

    await expect(value).rejects.toBe(error)
  })

  test('onSuccess', async () => {
    const action = vi.fn()
    const onSuccess = vi.fn()
    const { query } = createClient()

    query(action, [], { onSuccess })

    await vi.runOnlyPendingTimersAsync()

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  test('onError', async () => {
    const action = vi.fn(() => { throw new Error('test') })
    const onError = vi.fn()
    const { query } = createClient()

    query(action, [], { onError })

    await vi.runOnlyPendingTimersAsync()

    expect(onError).toHaveBeenCalledOnce()
  })

  test('placeholder', async () => {
    const placeholder = Symbol('placeholder')
    const response = Symbol('response')
    const { query } = createClient()

    const value = query(() => response, [], { placeholder })

    expect(value.response).toBe(placeholder)

    await vi.runOnlyPendingTimersAsync()

    expect(value.response).toBe(response)
  })
})

describe('useQuery', () => {
  describe('when parameters change', () => {
    testInEffectScope('response is updated', async () => {
      const responseTrue = Symbol('responseTrue')
      const responseFalse = Symbol('responseFalse')

      const action = vi.fn((value: boolean) => value ? responseTrue : responseFalse)
      const { useQuery } = createClient()

      const input = ref(false)

      const query = useQuery(action, () => [input.value])

      expect(query.response).toBe(undefined)

      await vi.runOnlyPendingTimersAsync()

      expect(query.response).toBe(responseFalse)

      input.value = true

      await vi.runOnlyPendingTimersAsync()

      expect(query.response).toBe(responseTrue)
    })

    testInEffectScope('executed and executing are updated', async () => {
      const responseTrue = Symbol('responseTrue')
      const responseFalse = Symbol('responseFalse')

      const action = vi.fn(async (value: boolean) => {
        await timeout(5000)

        return value ? responseTrue : responseFalse
      })

      const { useQuery } = createClient()

      const input = ref(false)

      const query = useQuery(action, () => [input.value])

      await vi.advanceTimersByTimeAsync(0)

      expect(query.executing).toBe(true)
      expect(query.executed).toBe(false)

      await vi.runOnlyPendingTimersAsync()

      expect(query.executing).toBe(false)
      expect(query.executed).toBe(true)

      input.value = true

      await vi.advanceTimersByTimeAsync(0)

      expect(query.executing).toBe(true)
      expect(query.executed).toBe(false)

      await vi.runOnlyPendingTimersAsync()

      expect(query.executing).toBe(false)
      expect(query.executed).toBe(true)
    })

    testInEffectScope('when parameters become null, response is set to placeholder', async () => {
      const responseTrue = Symbol('responseTrue')
      const responseFalse = Symbol('responseFalse')
      const placeholder = Symbol('placeholder')

      const action = vi.fn(async (value: boolean) => {
        await timeout(5000)

        return value ? responseTrue : responseFalse
      })

      const { useQuery } = createClient()

      const parameters = ref<[boolean] | null>([false])

      const query = useQuery(action, () => parameters.value, {placeholder })

      await vi.runAllTimersAsync()

      expect(query.response).toBe(responseFalse)

      parameters.value = [true]

      await vi.runOnlyPendingTimersAsync()

      parameters.value = null

      await vi.runOnlyPendingTimersAsync()

      expect(query.response).toBe(placeholder)
      expect(query.executing).toBe(false)
      expect(query.executed).toBe(false)
    })
  })

  testInEffectScope('awaiting a query returns the response', async () => {
    vi.useRealTimers()
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { useQuery } = createClient()

    const query = await useQuery(action, [])

    expect(query.response).toBe(response)
  })

  testInEffectScope('awaiting a query throws an error if the action throws an error', async () => {
    vi.useRealTimers()
    const action = vi.fn(() => { throw new Error('test') })
    const { useQuery } = createClient()
    const value = useQuery(action, [])
  
    await expect(value).rejects.toThrow('test')
  })

  testInEffectScope('changing parameters preserves previous response', async () => {
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

    await vi.runAllTimersAsync()

    expect(query.response).toBe(responseFalse)

    input.value = true

    await vi.advanceTimersByTimeAsync(0)

    expect(query.response).toBe(responseFalse)

    await vi.runOnlyPendingTimersAsync()

    expect(query.response).toBe(responseTrue)

    input.value = true

    await vi.runOnlyPendingTimersAsync()

    expect(query.response).toBe(responseTrue)

    input.value = null

    await vi.runOnlyPendingTimersAsync()

    expect(query.response).toBeUndefined()
  })

  testInEffectScope('queries do not interfere with each other', async () => {
    const action1 = vi.fn(() => true)
    const action2 = vi.fn(() => false)
    const { useQuery } = createClient()

    const query1 = useQuery(action1, [])
    const query2 = useQuery(action2, [])

    await vi.runOnlyPendingTimersAsync()

    expect(query1.response).toBe(true)
    expect(query2.response).toBe(false)
  })

  testInEffectScope('placeholder', async () => {
    const placeholder = Symbol('placeholder')
    const response = Symbol('response')
    const { useQuery } = createClient()

    const value = useQuery(() => response, [], { placeholder })

    expect(value.response).toBe(placeholder)

    await vi.runOnlyPendingTimersAsync()

    expect(value.response).toBe(response)
  })
})

describe('defineQuery', () => {
  test('returns a defined query function', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createClient()

    const { query } = defineQuery(action)

    const value = query([])

    await vi.runOnlyPendingTimersAsync()

    expect(value.response).toBe(response)
  })

  testInEffectScope('returns a defined query composition', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createClient()

    const { useQuery } = defineQuery(action)

    const value = useQuery([])

    await vi.runOnlyPendingTimersAsync()

    expect(value.response).toBe(response)
  })
})

describe('options', () => {
  test('retries', async () => {
    const action = vi.fn(() => { throw new Error('test') })
    const { query } = createClient({ retries: { count: 1, delay: 100 }})

    const result = query(action, [])

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