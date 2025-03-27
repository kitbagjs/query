import { describe, expectTypeOf, test } from "vitest"
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
  test('has correct data type', async () => {
    const { setQueryData } = createQueryClient()
    const untypedTag = tag()
    const numberTag = tag<number>()
    const stringTag = tag<string>()

    const action = (_arg: number) => 'foo'

    setQueryData(action, (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return data
    })

    setQueryData(action, [1], (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return data
    })

    setQueryData(stringTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return data
    })

    setQueryData(numberTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<number>()
      return data
    })

    setQueryData(untypedTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<unknown>()
      return data
    })

    setQueryData([stringTag, numberTag], (data) => {
      expectTypeOf(data).toEqualTypeOf<string | number>()
      return data
    })

    setQueryData([stringTag, numberTag, untypedTag], (data) => {
      expectTypeOf(data).toEqualTypeOf<unknown>()
      return data
    })
  })

  test('enforces correct return type', async () => {
    const { setQueryData } = createQueryClient()
    const untypedTag = tag()
    const numberTag = tag<number>()
    const stringTag = tag<string>()

    const action = (_arg: number) => 'foo'

    // passes
    setQueryData(action, () => {
      return 'string'
    })

    // @ts-expect-error
    setQueryData(action, () => {
      return 1
    })

    // passes
    setQueryData(action, [1], () => {
      return 'string'
    })

    // @ts-expect-error
    setQueryData(action, [1], () => {
      return 1
    })

    // passes
    setQueryData(stringTag, () => {
      return 'string'
    })

    // @ts-expect-error
    setQueryData(stringTag, () => {
      return 1
    })

    // passes
    setQueryData([stringTag, numberTag], (data) => {
      if(typeof data === 'string') {
        return 'string'
      }

      return 1
    })

    // @ts-expect-error
    setQueryData([stringTag, numberTag], () => {
      return true
    })

    // passes
    setQueryData(untypedTag, () => {
      return 'string' as unknown
    })

    // passes
    setQueryData([stringTag, numberTag, untypedTag], () => {
      return 'string' as unknown
    })
  })
})