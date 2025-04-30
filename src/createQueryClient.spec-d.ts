import { describe, expect, expectTypeOf, test } from "vitest"
import { createQueryClient } from "./createQueryClient"
import { tag } from "./tag"

describe('options', () => {
  test('tags', async () => {
    const action = () => 'response'
    const { query } = createQueryClient()
    const numberTag = tag<number>()
    const stringTag = tag<string>()
    const untypedTag = tag()

    // @ts-expect-error
    query(action, [], { tags: [numberTag, stringTag] })

    // @ts-expect-error
    query(action, [], { tags: () => [numberTag, stringTag] })

    query(action, [], { tags: [stringTag, untypedTag] })
    query(action, [], { tags: () => [stringTag, untypedTag] })

    query(action, [], { tags: [untypedTag] })
    query(action, [], { tags: () => [untypedTag] })
  })
})

describe('setQueryData', () => {
  test('tags', async () => {
    const { setQueryData } = createQueryClient()
    const numberTag = tag<number>()
    const stringTag = tag<string>()
    const untypedTag = tag()

    setQueryData(untypedTag, (data) => {
      expectTypeOf(data).toMatchTypeOf<unknown>()
      return 'foo'
    })

    setQueryData(numberTag, (data) => {
      expectTypeOf(data).toMatchTypeOf<number>()
      return 2
    })

    setQueryData(stringTag, (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()
      return 'new string'
    })

    setQueryData([untypedTag], (data) => {
      expectTypeOf(data).toMatchTypeOf<unknown>()
      return 'foo'
    })

    setQueryData([numberTag], (data) => {
      expectTypeOf(data).toMatchTypeOf<number>()
      return 2
    })

    // this is kinda interesting, no matter the data the return type is the union :thinking:
    // so there's not really a type safe way to update multiple queries at once
    setQueryData([numberTag, stringTag], (data) => {
      expectTypeOf(data).toMatchTypeOf<number | string>()
      return 'foo'
    })

    setQueryData([untypedTag, stringTag, numberTag], (data) => {
      expectTypeOf(data).toMatchTypeOf<unknown>()
      return 'foo'
    })

    // @ts-expect-error
    setQueryData(numberTag, (data) => {
      expectTypeOf(data).toMatchTypeOf<number>()
      return 'string'
    })

    // @ts-expect-error
    setQueryData([numberTag, stringTag], (data) => {
      expectTypeOf(data).toMatchTypeOf<number | string>()
      return []
    })
  })

  test('actions', () => {
    const { setQueryData } = createQueryClient()

    const stringAction = () => 'foo'
    const numberAction = () => 2

    setQueryData(stringAction, (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()
      return 'bar'
    })

    setQueryData(numberAction, (data) => {
      expectTypeOf(data).toMatchTypeOf<number>()
      return 3
    })

    // @ts-expect-error
    setQueryData(stringAction, (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()
      return 3
    })
  })

  test('actions with parameters', () => {
    const { setQueryData } = createQueryClient()

    const stringAction = (param: string) => param
    const numberAction = (param: number) => param

    setQueryData(stringAction, ['foo'], (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()
      return 'bar'
    })

    setQueryData(numberAction, [2], (data) => {
      expectTypeOf(data).toMatchTypeOf<number>()
      return 3
    })

    // @ts-expect-error
    setQueryData(stringAction, ['foo'], (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()
      return 3
    })
  })
})