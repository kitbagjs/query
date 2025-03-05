import { test, expect, vi } from "vitest"
import { createChannels } from "./createChannels"
import * as CreateChannelExports from './createChannel'
import { QueryAction } from "./types/query"

const getRandomNumber = () => Math.random()
const multipleByTwo = (value: number) => value * 2

test('whenever createQuery is called with a new action, it should create a channel', () => {
  const createChannel = vi.spyOn(CreateChannelExports, 'createChannel')
  const { createQuery } = createChannels()

  const times = 10

  for(let i = 0; i < times; i++) {
    createQuery(() => i, [])
  }

  expect(createChannel).toHaveBeenCalledTimes(times)
})

test('whenever createQuery is called with new args, it should create a channel', () => {
  const createChannel = vi.spyOn(CreateChannelExports, 'createChannel')
  const { createQuery } = createChannels()

  const times = 10

  for(let i = 0; i < times; i++) {
    createQuery(multipleByTwo, [i])
  }

  expect(createChannel).toHaveBeenCalledTimes(times)
})

test.each<[QueryAction, Parameters<QueryAction>]>([
  [getRandomNumber, []],
  [multipleByTwo, [1]],
])('whenever createQuery is called with the same action and same args, it should NOT create a channel', (action, args) => {
  const createChannel = vi.spyOn(CreateChannelExports, 'createChannel')
  const { createQuery } = createChannels()

  const times = 10

  for(let i = 0; i < times; i++) {
    createQuery(action, args)
  }

  expect(createChannel).toHaveBeenCalledOnce()
})

test('when createQuery is called, it should pass options through to the channel', () => {
  const subscribe = vi.fn()

  vi.spyOn(CreateChannelExports, 'createChannel').mockReturnValue({
    subscribe,
    active: true
    
  })

  const { createQuery } = createChannels()
  const options = {
    onSuccess: vi.fn(),
    onError: vi.fn(),
  }

  createQuery(getRandomNumber, [], options)

  expect(subscribe).toHaveBeenCalledOnce()
  expect(subscribe).toHaveBeenCalledWith(options)
})
