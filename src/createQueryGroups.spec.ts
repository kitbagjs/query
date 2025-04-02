import { test, expect, vi, describe, beforeEach, afterEach } from "vitest"
import { createQueryGroups } from "./createQueryGroups"
import * as CreateQueryGroupExports from './createQueryGroup'
import { QueryAction } from "./types/query"
import { tag } from "./tag"

const getRandomNumber = () => Math.random()
const multipleByTwo = (value: number) => value * 2

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

describe('createQuery', () => {

  test('whenever createQuery is called with a new action, it should create a group', () => {
    const createQueryGroup = vi.spyOn(CreateQueryGroupExports, 'createQueryGroup')
    const { createQuery } = createQueryGroups()

    const times = 10

    for (let i = 0; i < times; i++) {
      createQuery(() => i, [])
    }

    expect(createQueryGroup).toHaveBeenCalledTimes(times)
  })

  test('whenever createQuery is called with new args, it should create a group', () => {
    const createQueryGroup = vi.spyOn(CreateQueryGroupExports, 'createQueryGroup')
    const { createQuery } = createQueryGroups()

    const times = 10

    for (let i = 0; i < times; i++) {
      createQuery(multipleByTwo, [i])
    }

    expect(createQueryGroup).toHaveBeenCalledTimes(times)
  })

  test.each<[QueryAction, Parameters<QueryAction>]>([
    [getRandomNumber, []],
    [multipleByTwo, [1]],
  ])('whenever createQuery is called with the same action and same args, it should NOT create a group', (action, args) => {
    const createQueryGroup = vi.spyOn(CreateQueryGroupExports, 'createQueryGroup')
    const { createQuery } = createQueryGroups()

    const times = 10

    for (let i = 0; i < times; i++) {
      createQuery(action, args)
    }

    expect(createQueryGroup).toHaveBeenCalledOnce()
  })

  test('when createQuery is called, it should pass options through to the group', () => {
    const subscribe = vi.fn()

    vi.spyOn(CreateQueryGroupExports, 'createQueryGroup').mockReturnValue({
      subscribe,
      active: true,
      hasTag: vi.fn(),
      execute: vi.fn(),
    })

    const { createQuery } = createQueryGroups()
    const options = {
      onSuccess: vi.fn(),
      onError: vi.fn(),
    }

    createQuery(getRandomNumber, [], options)

    expect(subscribe).toHaveBeenCalledOnce()
    expect(subscribe).toHaveBeenCalledWith(options)
  })
})


describe('getQueryGroups', () => {

  test('when given an action, returns all groups for that action', () => {
    const { createQuery, getQueryGroups } = createQueryGroups()

    const response = Symbol('response1')
    const action1 = (..._args: any[]) => response

    const response2 = Symbol('response2')
    const action2 = (..._args: any[]) => response2

    createQuery(action1, [1])
    createQuery(action1, [2])
    createQuery(action2, [3])

    const groups = getQueryGroups(action1)

    expect(groups.length).toBe(2)
  })

  test('when given an action and params, return one group', () => {
    const { createQuery, getQueryGroups } = createQueryGroups()

    const response = Symbol('response1')
    const action1 = (..._args: any[]) => response

    const response2 = Symbol('response2')
    const action2 = (..._args: any[]) => response2

    createQuery(action1, [1])
    createQuery(action1, [2])
    createQuery(action2, [3])

    const groups = getQueryGroups(action1, [1])

    expect(groups.length).toBe(1)
  })

  test('when given tag, return all groups for that tag', async () => {
    const { createQuery, getQueryGroups } = createQueryGroups()
    const tag1 = tag()
    const tag2 = tag()

    const response = Symbol('response1')
    const action1 = (..._args: any[]) => response

    const response2 = Symbol('response2')
    const action2 = (..._args: any[]) => response2

    createQuery(action1, [1], { tags: [tag1] })
    createQuery(action1, [2], { tags: [tag1] })
    createQuery(action2, [3], { tags: [tag2] })
    
    await vi.runOnlyPendingTimersAsync()

    const groups = getQueryGroups(tag1)
    
    expect(groups.length).toBe(2)
  })

  test('when given tags, return all groups for those tags', async () => {
    const { createQuery, getQueryGroups } = createQueryGroups()
    const tag1 = tag()
    const tag2 = tag()
    const tag3 = tag()

    const response = Symbol('response1')
    const action1 = (..._args: any[]) => response

    const response2 = Symbol('response2')
    const action2 = (..._args: any[]) => response2

    createQuery(action1, [1], { tags: [tag1] })
    createQuery(action1, [2], { tags: [tag1] })
    createQuery(action2, [3], { tags: [tag2] })
    createQuery(action2, [4], { tags: [tag3] })

    await vi.runOnlyPendingTimersAsync()

    const groups = getQueryGroups([tag1, tag2])
    
    expect(groups.length).toBe(3)
  })
})

describe('hasQueryGroup', () => {
  test('returns false after disposing of all queries', () => {
    const { createQuery, hasQueryGroup } = createQueryGroups()
    const query = createQuery(getRandomNumber, [])
  
    expect(hasQueryGroup(getRandomNumber, [])).toBe(true)
  
    query.dispose()
  
    expect(hasQueryGroup(getRandomNumber, [])).toBe(false)
  })
})