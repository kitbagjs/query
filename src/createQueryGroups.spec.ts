import { test, expect, vi } from "vitest"
import { createQueryGroups } from "./createQueryGroups"
import * as CreateQueryGroupExports from './createQueryGroup'
import { QueryAction } from "./types/query"

const getRandomNumber = () => Math.random()
const multipleByTwo = (value: number) => value * 2

test('whenever createQuery is called with a new action, it should create a group', () => {
  const createQueryGroup = vi.spyOn(CreateQueryGroupExports, 'createQueryGroup')
  const { createQuery } = createQueryGroups()

  const times = 10

  for(let i = 0; i < times; i++) {
    createQuery(() => i, [])
  }

  expect(createQueryGroup).toHaveBeenCalledTimes(times)
})

test('whenever createQuery is called with new args, it should create a group', () => {
  const createQueryGroup = vi.spyOn(CreateQueryGroupExports, 'createQueryGroup')
  const { createQuery } = createQueryGroups()

  const times = 10

  for(let i = 0; i < times; i++) {
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

  for(let i = 0; i < times; i++) {
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
