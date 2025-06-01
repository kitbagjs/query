/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { test, expect, vi, describe, afterEach, beforeEach } from 'vitest'
import { createQueryClient } from './createQueryClient'
import { effectScope, ref } from 'vue'
import { timeout } from './utilities/timeout'
import { tag } from './tag'

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
    const { query } = createQueryClient()

    query(action, [])
    query(action, [])
    query(action, [])

    await vi.runOnlyPendingTimersAsync()

    expect(action).toHaveBeenCalledOnce()
  })

  test.fails('using a query automatically disposes of the query', () => {
    const action = vi.fn(() => true)
    const { query } = createQueryClient()

    async function test() {
      using value = await query(action, [])

      return value.data
    }

    test()

    query(action, [])

    expect(action).toHaveBeenCalledTimes(2)
  })

  test('data is set after action is executed', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { query } = createQueryClient()
    const value = query(action, [])

    expect(value.data).toBeUndefined()

    await vi.runOnlyPendingTimersAsync()

    expect(value.data).toBe(response)
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
    const action = vi.fn(() => {
      throw error
    })
    const { query } = createQueryClient()
    const value = query(action, [])

    await vi.runOnlyPendingTimersAsync()

    expect(value.error).toBe(error)
  })

  test('awaiting a query returns the data', async () => {
    const response = Symbol('response')
    const action = vi.fn(async () => {
      await timeout(100)
      return response
    })

    const { query } = createQueryClient()
    const value = query(action, [])

    expect(value.data).toBeUndefined()

    await vi.runAllTimersAsync()

    expect(value.data).toBe(response)
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
    const action = vi.fn(() => {
      throw error
    })
    const { query } = createQueryClient()
    const value = query(action, [])

    await vi.runOnlyPendingTimersAsync()

    await expect(value).rejects.toBe(error)
  })

  test('onSuccess', async () => {
    const action = vi.fn()
    const onSuccess = vi.fn()
    const { query } = createQueryClient()

    query(action, [], { onSuccess })

    await vi.runOnlyPendingTimersAsync()

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  test('onError', async () => {
    const action = vi.fn(() => {
      throw new Error('test')
    })
    const onError = vi.fn()
    const { query } = createQueryClient()

    query(action, [], { onError })

    await vi.runOnlyPendingTimersAsync()

    expect(onError).toHaveBeenCalledOnce()
  })

  test('placeholder', async () => {
    const placeholder = Symbol('placeholder')
    const response = Symbol('response')
    const { query } = createQueryClient()

    const value = query(() => response, [], { placeholder })

    expect(value.data).toBe(placeholder)

    await vi.runOnlyPendingTimersAsync()

    expect(value.data).toBe(response)
  })
})

describe('useQuery', () => {
  describe('when parameters change', () => {
    testInEffectScope('data is updated', async () => {
      const responseTrue = Symbol('responseTrue')
      const responseFalse = Symbol('responseFalse')

      const action = vi.fn((value: boolean) => value ? responseTrue : responseFalse)
      const { useQuery } = createQueryClient()

      const input = ref(false)

      const query = useQuery(action, () => [input.value])

      expect(query.data).toBe(undefined)

      await vi.runOnlyPendingTimersAsync()

      expect(query.data).toBe(responseFalse)

      input.value = true

      await vi.runOnlyPendingTimersAsync()

      expect(query.data).toBe(responseTrue)
    })

    testInEffectScope('executed and executing are updated', async () => {
      const responseTrue = Symbol('responseTrue')
      const responseFalse = Symbol('responseFalse')

      const action = vi.fn(async (value: boolean) => {
        await timeout(5000)

        return value ? responseTrue : responseFalse
      })

      const { useQuery } = createQueryClient()

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

    testInEffectScope('when parameters become null, data is set to placeholder', async () => {
      const responseTrue = Symbol('responseTrue')
      const responseFalse = Symbol('responseFalse')
      const placeholder = Symbol('placeholder')

      const action = vi.fn(async (value: boolean) => {
        await timeout(5000)

        return value ? responseTrue : responseFalse
      })

      const { useQuery } = createQueryClient()

      const parameters = ref<[boolean] | null>([false])

      const query = useQuery(action, () => parameters.value, { placeholder })

      await vi.runAllTimersAsync()

      expect(query.data).toBe(responseFalse)

      parameters.value = [true]

      await vi.runOnlyPendingTimersAsync()

      parameters.value = null

      await vi.runOnlyPendingTimersAsync()

      expect(query.data).toBe(placeholder)
      expect(query.executing).toBe(false)
      expect(query.executed).toBe(false)
    })
  })

  testInEffectScope('awaiting a query returns the data', async () => {
    vi.useRealTimers()
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { useQuery } = createQueryClient()

    const query = await useQuery(action, [])

    expect(query.data).toBe(response)
  })

  testInEffectScope('awaiting a query throws an error if the action throws an error', async () => {
    vi.useRealTimers()
    const action = vi.fn(() => {
      throw new Error('test')
    })
    const { useQuery } = createQueryClient()
    const value = useQuery(action, [])

    await expect(value).rejects.toThrow('test')
  })

  testInEffectScope('changing parameters preserves previous data', async () => {
    const responseTrue = Symbol('responseTrue')
    const responseFalse = Symbol('responseFalse')
    const input = ref<boolean | null>(false)

    const action = vi.fn(async (value: boolean) => {
      await timeout(100)
      return value ? responseTrue : responseFalse
    })

    const { useQuery } = createQueryClient()

    const query = useQuery(action, () => {
      if (input.value === null) {
        return null
      }

      return [input.value]
    })

    expect(query.data).toBeUndefined()

    await vi.runAllTimersAsync()

    expect(query.data).toBe(responseFalse)

    input.value = true

    await vi.advanceTimersByTimeAsync(0)

    expect(query.data).toBe(responseFalse)

    await vi.runOnlyPendingTimersAsync()

    expect(query.data).toBe(responseTrue)

    input.value = true

    await vi.runOnlyPendingTimersAsync()

    expect(query.data).toBe(responseTrue)

    input.value = null

    await vi.runOnlyPendingTimersAsync()

    expect(query.data).toBeUndefined()
  })

  testInEffectScope('queries do not interfere with each other', async () => {
    const action1 = vi.fn(() => true)
    const action2 = vi.fn(() => false)
    const { useQuery } = createQueryClient()

    const query1 = useQuery(action1, [])
    const query2 = useQuery(action2, [])

    await vi.runOnlyPendingTimersAsync()

    expect(query1.data).toBe(true)
    expect(query2.data).toBe(false)
  })

  testInEffectScope('placeholder', async () => {
    const placeholder = Symbol('placeholder')
    const response = Symbol('response')
    const { useQuery } = createQueryClient()

    const value = useQuery(() => response, [], { placeholder })

    expect(value.data).toBe(placeholder)

    await vi.runOnlyPendingTimersAsync()

    expect(value.data).toBe(response)
  })

  describe('immediate', () => {
    testInEffectScope('when true, action is executed', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const { useQuery } = createQueryClient()

      const query = useQuery(action, [], { immediate: true })

      await vi.runOnlyPendingTimersAsync()

      expect(action).toHaveBeenCalled()
      expect(query.data).toBe(response)
    })

    testInEffectScope('when false, action is not executed', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const { useQuery } = createQueryClient()

      const query = useQuery(action, [], { immediate: false })

      await vi.runOnlyPendingTimersAsync()

      expect(action).not.toHaveBeenCalled()
      expect(query.data).toBe(undefined)
    })

    testInEffectScope('when false, placeholder is used', async () => {
      const response = Symbol('response')
      const placeholder = Symbol('placeholder')
      const action = vi.fn(() => response)
      const { useQuery } = createQueryClient()

      const query = useQuery(action, [], { immediate: false, placeholder })

      await vi.runOnlyPendingTimersAsync()

      expect(action).not.toHaveBeenCalled()
      expect(query.data).toBe(placeholder)
    })

    testInEffectScope('when false, action is executed when executed is called', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const { useQuery } = createQueryClient()

      const query = useQuery(action, [], { immediate: false })

      await vi.runOnlyPendingTimersAsync()

      expect(action).not.toHaveBeenCalled()

      query.execute()

      await vi.runOnlyPendingTimersAsync()

      expect(action).toHaveBeenCalled()
    })

    testInEffectScope('when false, execute resolves with the response', async () => {
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const { useQuery } = createQueryClient()

      const query = useQuery(action, [], { immediate: false })

      await vi.runOnlyPendingTimersAsync()

      expect(action).not.toHaveBeenCalled()

      const result = query.execute()

      await vi.runOnlyPendingTimersAsync()

      expect(action).toHaveBeenCalled()
      expect(query.data).toBe(response)
      await expect(result).resolves.toBe(response)
    })

    testInEffectScope('when false, execute rejects with the error', async () => {
      const error = new Error('test')
      const action = vi.fn(() => {
        throw error
      })
      const { useQuery } = createQueryClient()

      const query = useQuery(action, [], { immediate: false })

      await vi.runOnlyPendingTimersAsync()

      expect(action).not.toHaveBeenCalled()

      query.execute().catch((error: unknown) => {
        expect(error).toBe(error)
      })

      await vi.runOnlyPendingTimersAsync()

      expect(action).toHaveBeenCalled()
      expect(query.error).toBe(error)
      expect(query.errored).toBe(true)
    })
  })
})

describe('defineQuery', () => {
  test('returns a defined query function', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createQueryClient()

    const { query } = defineQuery(action)

    const value = query([])

    await vi.runOnlyPendingTimersAsync()

    expect(value.data).toBe(response)
  })

  testInEffectScope('returns a defined query composition', async () => {
    const response = Symbol('response')
    const action = vi.fn(() => response)
    const { defineQuery } = createQueryClient()

    const { useQuery } = defineQuery(action)

    const value = useQuery([])

    await vi.runOnlyPendingTimersAsync()

    expect(value.data).toBe(response)
  })
})

describe('options', () => {
  test('retries', async () => {
    const action = vi.fn(() => {
      throw new Error('test')
    })
    const { query } = createQueryClient({ retries: { count: 1, delay: 100 } })

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

describe('setQueryData', () => {
  test('tag', async () => {
    const { setQueryData, query } = createQueryClient()
    const stringTag = tag<string>()
    const numberTag = tag<number>()

    const stringAction = () => 'foo'
    const numberAction = () => 1

    const stringQuery = query(stringAction, [], { tags: [stringTag] })
    const numberQuery = query(numberAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    setQueryData(stringTag, () => {
      return 'bar'
    })

    setQueryData(numberTag, () => {
      return 2
    })

    expect(stringQuery.data).toBe('bar')
    expect(numberQuery.data).toBe(2)
  })

  test('tags', async () => {
    const { setQueryData, query } = createQueryClient()
    const stringTag = tag<string>()
    const numberTag = tag<number>()

    const stringAction = () => 'foo'
    const numberAction = () => 1

    const stringQuery = query(stringAction, [], { tags: [stringTag] })
    const numberQuery = query(numberAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    setQueryData([stringTag], () => {
      return 'bar'
    })

    setQueryData([numberTag], () => {
      return 2
    })

    expect(stringQuery.data).toBe('bar')
    expect(numberQuery.data).toBe(2)
  })

  test('action', async () => {
    const { setQueryData, query } = createQueryClient()

    const stringAction = () => 'foo'
    const numberAction = () => 1

    const stringQuery = query(stringAction, [])
    const numberQuery = query(numberAction, [])

    await vi.runOnlyPendingTimersAsync()

    setQueryData(stringAction, () => {
      return 'bar'
    })

    setQueryData(numberAction, () => {
      return 2
    })

    expect(stringQuery.data).toBe('bar')
    expect(numberQuery.data).toBe(2)
  })

  test('action with parameters', async () => {
    const { setQueryData, query } = createQueryClient()

    const stringAction = (param: string) => param
    const numberAction = (param: number) => param

    const stringQuery = query(stringAction, ['foo'])
    const stringQuery2 = query(stringAction, ['bar'])
    const numberQuery = query(numberAction, [1])
    const numberQuery2 = query(numberAction, [2])

    await vi.runOnlyPendingTimersAsync()

    setQueryData(stringAction, ['foo'], () => {
      return 'baz'
    })

    setQueryData(numberAction, [1], () => {
      return 3
    })

    expect(stringQuery.data).toBe('baz')
    expect(numberQuery.data).toBe(3)
    expect(stringQuery2.data).toBe('bar')
    expect(numberQuery2.data).toBe(2)
  })
})

describe('refreshQueryData', () => {
  test('tags', async () => {
    const { query, refreshQueryData } = createQueryClient()

    const numberAction = vi.fn()
    const stringAction = vi.fn()
    const numberTag = tag<number>()
    const stringTag = tag<string>()

    query(numberAction, [], { tags: [numberTag] })
    query(stringAction, [], { tags: [stringTag] })

    await vi.runOnlyPendingTimersAsync()

    expect(numberAction).toHaveBeenCalledTimes(1)
    expect(stringAction).toHaveBeenCalledTimes(1)

    refreshQueryData(numberTag)

    await vi.runOnlyPendingTimersAsync()

    expect(numberAction).toHaveBeenCalledTimes(2)
    expect(stringAction).toHaveBeenCalledTimes(1)
  })

  test('action', async () => {
    const { query, refreshQueryData } = createQueryClient()

    const actionA = vi.fn()
    const actionB = vi.fn()

    query(actionA, [])
    query(actionB, [])

    await vi.runOnlyPendingTimersAsync()

    expect(actionA).toHaveBeenCalledTimes(1)
    expect(actionB).toHaveBeenCalledTimes(1)

    refreshQueryData(actionA)

    await vi.runOnlyPendingTimersAsync()

    expect(actionA).toHaveBeenCalledTimes(2)
    expect(actionB).toHaveBeenCalledTimes(1)
  })

  test('action with parameters', async () => {
    const { query, refreshQueryData } = createQueryClient()

    const actionA = vi.fn((param: number) => param)
    const actionB = vi.fn((param: number) => param)

    query(actionA, [1])
    query(actionA, [2])
    query(actionB, [1])

    await vi.runOnlyPendingTimersAsync()

    expect(actionA).toHaveBeenCalledTimes(2)
    expect(actionB).toHaveBeenCalledTimes(1)

    refreshQueryData(actionA, [1])

    await vi.runOnlyPendingTimersAsync()

    expect(actionA).toHaveBeenCalledTimes(3)
    expect(actionB).toHaveBeenCalledTimes(1)
  })
})

describe('mutate', () => {
  test('calls action and sets mutation properties', async () => {
    const { mutate } = createQueryClient()
    const response = Symbol('response')
    const action = vi.fn(() => response)

    const result = mutate(action, [])

    expect(result.data).toBeUndefined()
    expect(result.error).toBeUndefined()
    expect(result.errored).toBe(false)
    expect(result.executed).toBe(false)
    expect(result.executing).toBe(true)

    await vi.runOnlyPendingTimersAsync()

    expect(action).toHaveBeenCalledWith()
    expect(action).toHaveBeenCalledTimes(1)
    expect(result.data).toBe(response)
    expect(result.error).toBeUndefined()
    expect(result.errored).toBe(false)
    expect(result.executed).toBe(true)
    expect(result.executing).toBe(false)
  })

  test('can be awaited', async () => {
    const { mutate } = createQueryClient()
    const response = Symbol('response')
    const action = vi.fn(() => response)

    const result = await mutate(action, [])

    expect(action).toHaveBeenCalledTimes(1)
    expect(result.data).toBe(response)
    expect(result.error).toBeUndefined()
    expect(result.errored).toBe(false)
    expect(result.executed).toBe(true)
    expect(result.executing).toBe(false)
  })

  test('captures error', async () => {
    const { mutate } = createQueryClient()
    const error = new Error()
    const action = vi.fn(() => {
      throw error
    })

    const result = mutate(action, [])

    await vi.runOnlyPendingTimersAsync()

    expect(result.error).toBe(error)
    expect(result.errored).toBe(true)
    expect(result.executed).toBe(true)
    expect(result.executing).toBe(false)
  })

  test('throws error if awaited', async () => {
    const { mutate } = createQueryClient()
    const error = new Error()
    const action = vi.fn(() => {
      throw error
    })

    const result = mutate(action, [])

    await expect(result).rejects.toBe(error)
  })

  test.each([
    [true],
    [undefined],
  ])('refreshes tagged queries: %s', async (refreshQueryData) => {
    const { mutate, query } = createQueryClient()
    const numberTag = tag<number>()
    const queryAction = vi.fn()
    const mutationAction = vi.fn()

    query(queryAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)

    mutate(mutationAction, [], {
      tags: [numberTag],
      refreshQueryData,
    })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(2)
  })

  test('does not refresh tagged queries if refreshQueryData is false', async () => {
    const { mutate, query } = createQueryClient()
    const numberTag = tag<number>()
    const queryAction = vi.fn()
    const mutationAction = vi.fn()

    query(queryAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)

    mutate(mutationAction, [], {
      tags: [numberTag],
      refreshQueryData: false,
    })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)
  })

  test('does not refresh tagged queries if the action throws an error', async () => {
    const { mutate, query } = createQueryClient()
    const numberTag = tag<number>()
    const queryAction = vi.fn()
    const mutationAction = vi.fn(() => {
      throw new Error()
    })

    query(queryAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)

    mutate(mutationAction, [], {
      tags: [numberTag],
    })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)
  })

  test('setQueryDataBefore updates data before the mutation is executed', async () => {
    const { mutate, query } = createQueryClient()
    const numberTag = tag<number>()
    const { promise } = Promise.withResolvers<number>()
    const queryResponse = 1
    const queryAction = vi.fn(() => queryResponse)
    const mutationAction = vi.fn((value: number) => promise.then(() => value))
    const mutationValue = 100

    const numberQuery = query(queryAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)
    expect(numberQuery.data).toBe(queryResponse)

    const setQueryDataBefore = vi.fn((data, { payload }) => payload[0] + data)

    mutate(mutationAction, [mutationValue], {
      tags: [numberTag],
      setQueryDataBefore,
    })

    await vi.runOnlyPendingTimersAsync()

    expect(mutationAction).toHaveBeenCalledTimes(1)
    expect(queryAction).toHaveBeenCalledTimes(1)
    expect(setQueryDataBefore).toHaveBeenCalledTimes(1)
    expect(setQueryDataBefore).toHaveBeenCalledWith(queryResponse, { payload: [mutationValue] })
    expect(numberQuery.data).toBe(mutationValue + queryResponse)
  })

  test('setQueryDataAfter updates data after the mutation is executed', async () => {
    const { mutate, query } = createQueryClient()
    const numberTag = tag<number>()
    const { promise, resolve } = Promise.withResolvers<number>()
    const queryResponse = 1
    const queryAction = vi.fn(() => queryResponse)
    const mutationAction = vi.fn((value: number) => promise.then(() => value * 10))
    const mutationValue = 10
    const mutationResponse = 100

    const numberQuery = query(queryAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    expect(queryAction).toHaveBeenCalledTimes(1)
    expect(numberQuery.data).toBe(queryResponse)

    const setQueryDataAfter = vi.fn((queryData, { payload, data }) => payload[0] + data + queryData)

    mutate(mutationAction, [mutationValue], {
      tags: [numberTag],
      refreshQueryData: false,
      setQueryDataAfter,
    })

    await vi.runOnlyPendingTimersAsync()

    expect(mutationAction).toHaveBeenCalledTimes(1)
    expect(queryAction).toHaveBeenCalledTimes(1)
    expect(setQueryDataAfter).toHaveBeenCalledTimes(0)

    resolve(mutationResponse)

    await vi.runOnlyPendingTimersAsync()

    expect(setQueryDataAfter).toHaveBeenCalledTimes(1)
    expect(setQueryDataAfter).toHaveBeenCalledWith(queryResponse, { payload: [mutationValue], data: mutationResponse })
    expect(numberQuery.data).toBe(mutationValue + queryResponse + mutationResponse)
  })
})

describe('useMutation', () => {
  test('executes the action each time mutate is called', async () => {
    const { useMutation } = createQueryClient()
    const responseA = Symbol('responseA')
    const responseB = Symbol('responseB')
    const action = vi.fn((input) => input)
    const mutation = useMutation(action)

    expect(action).toHaveBeenCalledTimes(0)
    expect(mutation.data).toBeUndefined()
    expect(mutation.error).toBeUndefined()
    expect(mutation.errored).toBe(false)
    expect(mutation.executed).toBe(false)
    expect(mutation.executing).toBe(false)

    await mutation.mutate(responseA)

    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledWith(responseA)
    expect(mutation.data).toBe(responseA)
    expect(mutation.error).toBeUndefined()
    expect(mutation.errored).toBe(false)
    expect(mutation.executed).toBe(true)
    expect(mutation.executing).toBe(false)

    await mutation.mutate(responseB)

    expect(action).toHaveBeenCalledTimes(2)
    expect(action).toHaveBeenCalledWith(responseB)
    expect(mutation.data).toBe(responseB)
    expect(mutation.error).toBeUndefined()
    expect(mutation.errored).toBe(false)
    expect(mutation.executed).toBe(true)
    expect(mutation.executing).toBe(false)
  })

  test('onSuccess is called each time the mutation is executed', async () => {
    const { useMutation } = createQueryClient()
    const onSuccess = vi.fn()
    const responseA = Symbol('responseA')
    const responseB = Symbol('responseB')
    const action = vi.fn((input) => input)
    const { mutate } = useMutation(action, { onSuccess })

    await mutate(responseA)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith({
      data: responseA,
      payload: [responseA],
    })

    await mutate(responseB)

    expect(onSuccess).toHaveBeenCalledTimes(2)
    expect(onSuccess).toHaveBeenCalledWith({
      data: responseB,
      payload: [responseB],
    })
  })

  test('onError is called each time the mutation fails', async () => {
    const { useMutation } = createQueryClient()
    const onError = vi.fn()
    const response = Symbol('response')
    const error = new Error()
    const action = vi.fn(({ shouldError }: { shouldError: boolean }) => {
      if (shouldError) {
        throw error
      }

      return response
    })

    const mutation = useMutation(action, { onError })

    await expect(mutation.mutate({ shouldError: true })).rejects.toBe(error)

    expect(mutation.data).toBeUndefined()
    expect(mutation.executed).toBe(true)
    expect(mutation.executing).toBe(false)
    expect(mutation.error).toBe(error)
    expect(mutation.errored).toBe(true)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith({
      error,
      payload: [{ shouldError: true }],
    })

    await mutation.mutate({ shouldError: false })

    expect(mutation.data).toBe(response)
    expect(mutation.executed).toBe(true)
    expect(mutation.executing).toBe(false)
    expect(mutation.error).toBeUndefined()
    expect(mutation.errored).toBe(false)

    await expect(mutation.mutate({ shouldError: true })).rejects.toBe(error)

    expect(mutation.data).toBe(response)
    expect(mutation.executed).toBe(true)
    expect(mutation.executing).toBe(false)
    expect(mutation.error).toBe(error)
    expect(mutation.errored).toBe(true)
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledWith({
      error,
      payload: [{ shouldError: true }],
    })
  })

  test('setQueryDataBefore and setQueryDataAfter are called when the mutation is executed', async () => {
    const { useMutation, query } = createQueryClient()
    const { promise, resolve } = Promise.withResolvers<void>()
    const numberTag = tag<number>()
    const queryAction = vi.fn()
    const mutationAction = vi.fn(() => promise)
    const setQueryDataBefore = vi.fn()
    const setQueryDataAfter = vi.fn()

    query(queryAction, [], { tags: [numberTag] })

    await vi.runOnlyPendingTimersAsync()

    const mutation = useMutation(mutationAction, {
      tags: [numberTag],
      setQueryDataBefore,
      setQueryDataAfter,
    })

    mutation.mutate()

    expect(setQueryDataBefore).toHaveBeenCalledTimes(1)
    expect(setQueryDataBefore).toHaveBeenCalledWith(undefined, { payload: [] })

    resolve()

    await vi.runOnlyPendingTimersAsync()

    expect(setQueryDataAfter).toHaveBeenCalledTimes(1)
    expect(setQueryDataAfter).toHaveBeenCalledWith(undefined, { payload: [] })
  })
})

describe('defineMutation', () => {
  describe('mutate', () => {
    test('executes the defined action', () => {
      const { defineMutation } = createQueryClient()
      const action = vi.fn()
      const { mutate } = defineMutation(action)

      const mutation = mutate([])

      expect(action).toHaveBeenCalledTimes(1)
      expect(mutation.data).toBeUndefined()
    })

    test('returns the correct values', async () => {
      const { defineMutation } = createQueryClient()
      const action = (value: number) => value
      const { mutate } = defineMutation(action)

      const mutation = mutate([1])

      expect(mutation.data).toBeUndefined()
      expect(mutation.error).toBeUndefined()
      expect(mutation.errored).toBe(false)
      expect(mutation.executed).toBe(false)
      expect(mutation.executing).toBe(true)

      await vi.runOnlyPendingTimersAsync()

      expect(mutation.data).toBe(1)
      expect(mutation.error).toBeUndefined()
      expect(mutation.errored).toBe(false)
      expect(mutation.executed).toBe(true)
      expect(mutation.executing).toBe(false)
    })

    describe('options', () => {
      describe('placeholder', () => {
        test('defined placeholder is used if no placeholder is provided', () => {
          const { defineMutation } = createQueryClient()
          const definedPlaceholder = 'definedPlaceholder'
          const action = vi.fn()
          const { mutate } = defineMutation(action, {
            placeholder: definedPlaceholder,
          })

          const mutation = mutate([])

          expect(mutation.data).toBe(definedPlaceholder)
        })

        test('provided placeholder is used instead of defined placeholder', () => {
          const { defineMutation } = createQueryClient()
          const definedPlaceholder = 'definedPlaceholder'
          const providedPlaceholder = 'providedPlaceholder'
          const action = vi.fn()
          const { mutate } = defineMutation(action, {
            placeholder: definedPlaceholder,
          })

          const mutation = mutate([], {
            placeholder: providedPlaceholder,
          })

          expect(mutation.data).toBe(providedPlaceholder)
        })
      })

      describe('retries', () => {
        test('defined retries are used if no retries are provided', async () => {
          const { defineMutation } = createQueryClient()
          const action = vi.fn(() => {
            throw new Error()
          })
          const { mutate } = defineMutation(action, { retries: 1 })

          mutate([])

          await vi.runOnlyPendingTimersAsync()

          expect(action).toHaveBeenCalledTimes(2)
        })

        test('provided retries are used instead of defined retries', async () => {
          const { defineMutation } = createQueryClient()
          const action = vi.fn(() => {
            throw new Error()
          })
          const { mutate } = defineMutation(action, { retries: 1 })

          mutate([], { retries: 2 })

          await vi.runOnlyPendingTimersAsync()
          await vi.runOnlyPendingTimersAsync()

          expect(action).toHaveBeenCalledTimes(3)
        })
      })

      describe('refreshQueryData', () => {
        test('defined refreshQueryData is used if no refreshQueryData is provided', async () => {
          const { defineMutation, query } = createQueryClient()
          const tagA = tag()
          const mutationAction = vi.fn()
          const { mutate } = defineMutation(mutationAction, {
            tags: [tagA],
            refreshQueryData: true,
          })

          const queryAction = vi.fn()
          query(queryAction, [], {
            tags: [tagA],
          })

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(1)

          mutate([])

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(2)
        })

        test('provided refreshQueryData is used instead of defined refreshQueryData', async () => {
          const { defineMutation, query } = createQueryClient()
          const tagA = tag()
          const mutationAction = vi.fn()
          const { mutate } = defineMutation(mutationAction, {
            tags: [tagA],
            refreshQueryData: false,
          })

          const queryAction = vi.fn()
          query(queryAction, [], {
            tags: [tagA],
          })

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(1)

          mutate([], {
            refreshQueryData: true,
          })

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(2)
        })
      })

      describe('onExecute', () => {
        test('both defined and provided onExecute callbacks are called', async () => {
          const { defineMutation } = createQueryClient()
          const definedOnExecute = vi.fn()
          const providedOnExecute = vi.fn()
          const { mutate } = defineMutation(vi.fn(), { onExecute: definedOnExecute })

          mutate([], { onExecute: providedOnExecute })

          await vi.runOnlyPendingTimersAsync()

          expect(definedOnExecute).toHaveBeenCalledTimes(1)
          expect(providedOnExecute).toHaveBeenCalledTimes(1)
        })
      })

      describe('onSuccess', () => {
        test('both defined and provided onSuccess callbacks are called with correct value', async () => {
          const { defineMutation } = createQueryClient()
          const definedOnSuccess = vi.fn()
          const providedOnSuccess = vi.fn()
          const action = (value: number) => value
          const { mutate } = defineMutation(action, { onSuccess: definedOnSuccess })

          mutate([1], { onSuccess: providedOnSuccess })

          await vi.runOnlyPendingTimersAsync()

          expect(definedOnSuccess).toHaveBeenCalledTimes(1)
          expect(providedOnSuccess).toHaveBeenCalledTimes(1)
          expect(definedOnSuccess).toHaveBeenCalledWith({
            data: 1,
            payload: [1],
          })
          expect(providedOnSuccess).toHaveBeenCalledWith({
            data: 1,
            payload: [1],
          })
        })
      })

      describe('onError', () => {
        test('both defined and provided onError are called with correct value', async () => {
          const { defineMutation } = createQueryClient()
          const definedOnError = vi.fn()
          const providedOnError = vi.fn()
          const error = new Error()
          const action = (value: number) => {
            if (value === 1) {
              throw error
            }
          }
          const { mutate } = defineMutation(action, { onError: definedOnError })

          mutate([1], { onError: providedOnError })

          await vi.runOnlyPendingTimersAsync()

          expect(definedOnError).toHaveBeenCalledTimes(1)
          expect(providedOnError).toHaveBeenCalledTimes(1)
          expect(definedOnError).toHaveBeenCalledWith({
            error,
            payload: [1],
          })
          expect(providedOnError).toHaveBeenCalledWith({
            error,
            payload: [1],
          })
        })
      })

      describe('setQueryData', () => {
        test('both defined and provided setQueryData callbacks are called with correct values and updates query data', async () => {
          const { defineMutation, query } = createQueryClient()
          const definedSetQueryDataBefore = vi.fn((value) => value + 1)
          const providedSetQueryDataBefore = vi.fn((value) => value + 1)
          const definedSetQueryDataAfter = vi.fn((value) => value + 1)
          const providedSetQueryDataAfter = vi.fn((value) => value + 1)
          const { promise, resolve } = Promise.withResolvers<void>()
          const mutationPayload = 1
          const mutationAction = (value: number) => promise.then(() => value)
          const tagA = tag()
          const tagB = tag()
          const queryAResponse = 1
          const queryBResponse = 1
          const queryAAction = () => queryAResponse
          const queryBAction = () => queryBResponse

          const queryA = query(queryAAction, [], { tags: [tagA] })
          const queryB = query(queryBAction, [], { tags: [tagB] })

          await vi.runOnlyPendingTimersAsync()

          expect(queryA.data).toBe(queryAResponse)
          expect(queryB.data).toBe(queryBResponse)

          const { mutate } = defineMutation(mutationAction, {
            tags: [tagA],
            setQueryDataBefore: definedSetQueryDataBefore,
            setQueryDataAfter: definedSetQueryDataAfter,
          })

          mutate([mutationPayload], {
            tags: [tagB],
            refreshQueryData: false,
            setQueryDataBefore: providedSetQueryDataBefore,
            setQueryDataAfter: providedSetQueryDataAfter,
          })

          await vi.runOnlyPendingTimersAsync()

          expect(definedSetQueryDataBefore).toHaveBeenCalledTimes(1)
          expect(definedSetQueryDataBefore).toHaveBeenCalledWith(queryAResponse, { payload: [mutationPayload] })

          expect(providedSetQueryDataBefore).toHaveBeenCalledTimes(1)
          expect(providedSetQueryDataBefore).toHaveBeenCalledWith(queryBResponse, { payload: [mutationPayload] })

          resolve()

          await vi.runOnlyPendingTimersAsync()

          expect(definedSetQueryDataAfter).toHaveBeenCalledTimes(1)
          expect(definedSetQueryDataAfter).toHaveBeenCalledWith(queryAResponse + 1, { payload: [mutationPayload], data: mutationPayload })

          expect(providedSetQueryDataAfter).toHaveBeenCalledTimes(1)
          expect(providedSetQueryDataAfter).toHaveBeenCalledWith(queryBResponse + 1, { payload: [mutationPayload], data: mutationPayload })

          expect(queryA.data).toBe(queryAResponse + 2)
          expect(queryB.data).toBe(queryBResponse + 2)
        })
      })
    })
  })

  describe('useMutation', () => {
    test('executes the defined action', async () => {
      const { defineMutation } = createQueryClient()
      const action = vi.fn()
      const { useMutation } = defineMutation(action)

      const mutation = useMutation()

      mutation.mutate()

      expect(action).toHaveBeenCalledTimes(1)
      expect(mutation.data).toBeUndefined()
    })

    test('returns the correct values', async () => {
      const { defineMutation } = createQueryClient()
      const response = Symbol('response')
      const action = vi.fn(() => response)
      const { useMutation } = defineMutation(action)

      const mutation = useMutation()

      expect(mutation.data).toBeUndefined()
      expect(mutation.error).toBeUndefined()
      expect(mutation.errored).toBe(false)
      expect(mutation.executed).toBe(false)
      expect(mutation.executing).toBe(false)

      const promise = mutation.mutate()

      expect(mutation.data).toBeUndefined()
      expect(mutation.error).toBeUndefined()
      expect(mutation.errored).toBe(false)
      expect(mutation.executed).toBe(false)
      expect(mutation.executing).toBe(true)

      await promise

      expect(mutation.data).toBe(response)
      expect(mutation.error).toBeUndefined()
      expect(mutation.errored).toBe(false)
      expect(mutation.executed).toBe(true)
      expect(mutation.executing).toBe(false)
    })

    describe('options', () => {
      describe('placeholder', () => {
        test('defined placeholder is used if no placeholder is provided', () => {
          const { defineMutation } = createQueryClient()
          const definedPlaceholder = 'definedPlaceholder'
          const action = vi.fn()
          const { useMutation } = defineMutation(action, {
            placeholder: definedPlaceholder,
          })

          const mutation = useMutation()

          expect(mutation.data).toBe(definedPlaceholder)
        })

        test('provided placeholder is used instead of defined placeholder', () => {
          const { defineMutation } = createQueryClient()
          const definedPlaceholder = 'definedPlaceholder'
          const providedPlaceholder = 'providedPlaceholder'
          const action = vi.fn()
          const { useMutation } = defineMutation(action, {
            placeholder: definedPlaceholder,
          })

          const mutation = useMutation({
            placeholder: providedPlaceholder,
          })

          mutation.mutate()

          expect(mutation.data).toBe(providedPlaceholder)
        })
      })

      describe('retries', () => {
        test('defined retries are used if no retries are provided', async () => {
          const { defineMutation } = createQueryClient()
          const error = new Error()
          const action = vi.fn(() => {
            throw error
          })
          const { useMutation } = defineMutation(action, {
            retries: {
              count: 1,
              delay: 0,
            },
          })

          const mutation = useMutation()

          await expect(mutation.mutate()).rejects.toBe(error)
          expect(action).toHaveBeenCalledTimes(2)
        })

        test('provided retries are used instead of defined retries', async () => {
          const { defineMutation } = createQueryClient()
          const error = new Error()
          const action = vi.fn(() => {
            throw error
          })
          const { useMutation } = defineMutation(action, {
            retries: {
              count: 1,
              delay: 0,
            },
          })

          const mutation = useMutation({
            retries: {
              count: 2,
              delay: 0,
            },
          })

          await expect(mutation.mutate()).rejects.toBe(error)

          expect(action).toHaveBeenCalledTimes(3)
        })
      })

      describe('refreshQueryData', () => {
        test('defined refreshQueryData is used if no refreshQueryData is provided', async () => {
          const { defineMutation, query } = createQueryClient()
          const tagA = tag()
          const mutationAction = vi.fn()
          const { useMutation } = defineMutation(mutationAction, {
            tags: [tagA],
            refreshQueryData: true,
          })

          const queryAction = vi.fn()
          query(queryAction, [], {
            tags: [tagA],
          })

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(1)

          const mutation = useMutation()

          mutation.mutate()

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(2)
        })

        test('provided refreshQueryData is used instead of defined refreshQueryData', async () => {
          const { defineMutation, query } = createQueryClient()
          const tagA = tag()
          const mutationAction = vi.fn()
          const { useMutation } = defineMutation(mutationAction, {
            tags: [tagA],
            refreshQueryData: false,
          })

          const queryAction = vi.fn()
          query(queryAction, [], {
            tags: [tagA],
          })

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(1)

          const mutation = useMutation({
            refreshQueryData: true,
          })

          mutation.mutate()

          await vi.runOnlyPendingTimersAsync()
          expect(queryAction).toHaveBeenCalledTimes(2)
        })
      })

      describe('onExecute', () => {
        test('both defined and provided onExecute callbacks are called', async () => {
          const { defineMutation } = createQueryClient()
          const definedOnExecute = vi.fn()
          const providedOnExecute = vi.fn()
          const { useMutation } = defineMutation(vi.fn(), { onExecute: definedOnExecute })

          const mutation = useMutation({ onExecute: providedOnExecute })

          mutation.mutate()

          await vi.runOnlyPendingTimersAsync()

          expect(definedOnExecute).toHaveBeenCalledTimes(1)
          expect(providedOnExecute).toHaveBeenCalledTimes(1)
        })
      })

      describe('onSuccess', () => {
        test('both defined and provided onSuccess callbacks are called with correct value', async () => {
          const { defineMutation } = createQueryClient()
          const definedOnSuccess = vi.fn()
          const providedOnSuccess = vi.fn()
          const action = (value: number) => value
          const { useMutation } = defineMutation(action, { onSuccess: definedOnSuccess })

          const mutation = useMutation({ onSuccess: providedOnSuccess })

          mutation.mutate(1)

          await vi.runOnlyPendingTimersAsync()

          expect(definedOnSuccess).toHaveBeenCalledTimes(1)
          expect(providedOnSuccess).toHaveBeenCalledTimes(1)
          expect(definedOnSuccess).toHaveBeenCalledWith({
            data: 1,
            payload: [1],
          })
          expect(providedOnSuccess).toHaveBeenCalledWith({
            data: 1,
            payload: [1],
          })
        })
      })

      describe('onError', () => {
        test('both defined and provided onError are called with correct value', async () => {
          const { defineMutation } = createQueryClient()
          const definedOnError = vi.fn()
          const providedOnError = vi.fn()
          const error = new Error()
          const action = (value: number) => {
            if (value === 1) {
              throw error
            }
          }
          const { useMutation } = defineMutation(action, { onError: definedOnError })

          const mutation = useMutation({ onError: providedOnError })

          mutation.mutate(1).catch(() => {
            // suppress error in test
          })

          await vi.runOnlyPendingTimersAsync()

          expect(definedOnError).toHaveBeenCalledTimes(1)
          expect(providedOnError).toHaveBeenCalledTimes(1)
          expect(definedOnError).toHaveBeenCalledWith({
            error,
            payload: [1],
          })
          expect(providedOnError).toHaveBeenCalledWith({
            error,
            payload: [1],
          })
        })
      })

      describe('setQueryData', () => {
        test('both defined and provided setQueryData callbacks are called with correct values and updates query data', async () => {
          const { defineMutation, query } = createQueryClient()
          const definedSetQueryDataBefore = vi.fn((value) => value + 1)
          const providedSetQueryDataBefore = vi.fn((value) => value + 1)
          const definedSetQueryDataAfter = vi.fn((value) => value + 1)
          const providedSetQueryDataAfter = vi.fn((value) => value + 1)
          const { promise, resolve } = Promise.withResolvers<void>()
          const mutationPayload = 1
          const mutationAction = (value: number) => promise.then(() => value)
          const tagA = tag()
          const tagB = tag()
          const queryAResponse = 1
          const queryBResponse = 1
          const queryAAction = () => queryAResponse
          const queryBAction = () => queryBResponse

          const queryA = query(queryAAction, [], { tags: [tagA] })
          const queryB = query(queryBAction, [], { tags: [tagB] })

          await vi.runOnlyPendingTimersAsync()

          expect(queryA.data).toBe(queryAResponse)
          expect(queryB.data).toBe(queryBResponse)

          const { useMutation } = defineMutation(mutationAction, {
            tags: [tagA],
            setQueryDataBefore: definedSetQueryDataBefore,
            setQueryDataAfter: definedSetQueryDataAfter,
          })

          const mutation = useMutation({
            tags: [tagB],
            refreshQueryData: false,
            setQueryDataBefore: providedSetQueryDataBefore,
            setQueryDataAfter: providedSetQueryDataAfter,
          })

          mutation.mutate(mutationPayload)

          await vi.runOnlyPendingTimersAsync()

          expect(definedSetQueryDataBefore).toHaveBeenCalledTimes(1)
          expect(definedSetQueryDataBefore).toHaveBeenCalledWith(queryAResponse, { payload: [mutationPayload] })

          expect(providedSetQueryDataBefore).toHaveBeenCalledTimes(1)
          expect(providedSetQueryDataBefore).toHaveBeenCalledWith(queryBResponse, { payload: [mutationPayload] })

          resolve()

          await vi.runOnlyPendingTimersAsync()

          expect(definedSetQueryDataAfter).toHaveBeenCalledTimes(1)
          expect(definedSetQueryDataAfter).toHaveBeenCalledWith(queryAResponse + 1, { payload: [mutationPayload], data: mutationPayload })

          expect(providedSetQueryDataAfter).toHaveBeenCalledTimes(1)
          expect(providedSetQueryDataAfter).toHaveBeenCalledWith(queryBResponse + 1, { payload: [mutationPayload], data: mutationPayload })

          expect(queryA.data).toBe(queryAResponse + 2)
          expect(queryB.data).toBe(queryBResponse + 2)
        })
      })
    })
  })
})
