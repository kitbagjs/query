import { describe, expectTypeOf, test, vi } from 'vitest'
import { createQueryClient } from './createQueryClient'
import { tag } from './tag'

describe('query', () => {
  describe('options', () => {
    test('placeholder', async () => {
      const { query } = createQueryClient()
      const response = 'response' as const
      const placeholder = 'placeholder' as const
      const action = () => response

      const queryA = query(action, [])
      expectTypeOf(queryA.data).toEqualTypeOf<typeof response | undefined>()

      const queryB = query(action, [], { placeholder })
      expectTypeOf(queryB.data).toEqualTypeOf<typeof response | typeof placeholder>()

      const queryC = await query(action, [])
      expectTypeOf(queryC.data).toEqualTypeOf<typeof response>()

      const queryD = await query(action, [], { placeholder })
      expectTypeOf(queryD.data).toEqualTypeOf<typeof response>()
    })

    test('tags', async () => {
      const action = () => 'response'
      const { query, setQueryData } = createQueryClient()
      const stringTag = tag().add<string, 'name'>('name')
      const untypedTag = tag()

      query(action, [], { tags: [stringTag, untypedTag] })
      query(action, [], { tags: () => [stringTag, untypedTag] })

      query(action, [], { tags: [untypedTag] })
      query(action, [], { tags: () => [untypedTag] })

      setQueryData(stringTag, (data) => {
        expectTypeOf(data).toEqualTypeOf<string>()
        return data + 'bar'
      })

      // @ts-expect-error - sharedTag has data: never, can't return anything useful
      setQueryData(untypedTag, (data) => {
        expectTypeOf(data).toEqualTypeOf<never>()
        return 'could be corrupting'
      })
    })
  })
})

describe('useQuery', () => {
  describe('options', () => {
    test('placeholder', async () => {
      const { useQuery } = createQueryClient()
      const response = 'response' as const
      const placeholder = 'placeholder' as const
      const action = () => response

      const queryA = useQuery(action, () => [])
      expectTypeOf(queryA.data).toEqualTypeOf<typeof response | undefined>()

      const queryB = useQuery(action, () => [], { placeholder })
      expectTypeOf(queryB.data).toEqualTypeOf<typeof response | typeof placeholder>()

      const queryC = await useQuery(action, () => [])
      expectTypeOf(queryC.data).toEqualTypeOf<typeof response>()

      const queryD = await useQuery(action, () => [], { placeholder })
      expectTypeOf(queryD.data).toEqualTypeOf<typeof response>()
    })
  })
})

describe('defineQuery', () => {
  describe('options', () => {
    test('placeholder', async () => {
      const { defineQuery } = createQueryClient()
      const response = 'response' as const
      const definedPlaceholder = 'defined placeholder' as const
      const placeholder = 'placeholder' as const
      const action = () => response

      const { query: definedWithNoPlaceholder } = defineQuery(action)
      const queryA = definedWithNoPlaceholder([])
      expectTypeOf(queryA.data).toEqualTypeOf<typeof response | undefined>()

      const { query: definedWithPlaceholder } = defineQuery(action, { placeholder: definedPlaceholder })

      const queryB = definedWithPlaceholder([])
      expectTypeOf(queryB.data).toEqualTypeOf<typeof response | typeof definedPlaceholder>()

      const queryC = definedWithPlaceholder([], { placeholder })
      expectTypeOf(queryC.data).toEqualTypeOf<typeof response | typeof placeholder>()

      const queryD = await definedWithPlaceholder([])
      expectTypeOf(queryD.data).toEqualTypeOf<typeof response>()

      const queryE = await definedWithPlaceholder([], { placeholder })
      expectTypeOf(queryE.data).toEqualTypeOf<typeof response>()
    })
  })
})

describe('setQueryData', () => {
  test('naked tag is not setQueryData-able (data: never)', () => {
    const { setQueryData } = createQueryClient()
    const myTag = tag()

    // @ts-expect-error - data: never, return must be never (effectively impossible)
    setQueryData(myTag, () => 'anything')
  })

  test('typed tag passes data through with its declared type', () => {
    const { setQueryData } = createQueryClient()
    const numberTag = tag<number>()

    setQueryData(numberTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<number>()
      return data + 1
    })

    // @ts-expect-error - returning wrong type
    setQueryData(numberTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<number>()
      return 'wrong type'
    })
  })

  test('descendant tag has its own data type', () => {
    const { setQueryData } = createQueryClient()
    const sharedTag = tag()
    const userTag = sharedTag.add<{ id: number }, 'user'>('user')

    setQueryData(userTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<{ id: number }>()
      return data
    })

    // ancestor tag is still locked at the type level
    // @ts-expect-error - sharedTag has data: never
    setQueryData(sharedTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<never>()

      return 'could be corrupting'
    })
  })

  test('descendants nest arbitrarily deep', () => {
    const { setQueryData } = createQueryClient()
    const sharedTag = tag()
    const userTag = sharedTag.add<{ id: number }, 'user'>('user')
    const userAvatarTag = userTag.add<{ id: number, url: string }, 'avatar'>('avatar')

    setQueryData(userAvatarTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<{ id: number, url: string }>()
      return data
    })

    setQueryData(userTag, (data) => {
      expectTypeOf(data).toEqualTypeOf<{ id: number }>()
      return data
    })
  })

  test('actions', () => {
    const { setQueryData } = createQueryClient()

    const stringAction = () => 'foo'
    const numberAction = () => 2

    setQueryData(stringAction, (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return 'bar'
    })

    setQueryData(numberAction, (data) => {
      expectTypeOf(data).toEqualTypeOf<number>()
      return 3
    })

    // @ts-expect-error - string tag with numeric return type
    setQueryData(stringAction, (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return 3
    })
  })

  test('actions with parameters', () => {
    const { setQueryData } = createQueryClient()

    const stringAction = (param: string) => param
    const numberAction = (param: number) => param

    setQueryData(stringAction, ['foo'], (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return 'bar'
    })

    setQueryData(numberAction, [2], (data) => {
      expectTypeOf(data).toEqualTypeOf<number>()
      return 3
    })

    // @ts-expect-error - string tag with numeric return type
    setQueryData(stringAction, ['foo'], (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
      return 3
    })
  })
})

describe('refreshQueryData', () => {
  test('data', async () => {
    const { mutate, useMutation } = createQueryClient()

    const action = (value: number) => value

    const mutationA = useMutation(action)
    const mutationB = mutate(action, [1])

    expectTypeOf(mutationA.data).toEqualTypeOf<number | undefined>()
    expectTypeOf(mutationB.data).toEqualTypeOf<number | undefined>()

    const mutationC = await useMutation(action)
    const mutationD = await mutate(action, [1])

    expectTypeOf(mutationC.data).toEqualTypeOf<number>()
    expectTypeOf(mutationD.data).toEqualTypeOf<number>()
  })

  test('placeholder', async () => {
    const { mutate, useMutation } = createQueryClient()

    const action = (value: number) => value

    const mutationA = useMutation(action, {
      placeholder: 'foo',
    })

    const mutationB = mutate(action, [1], {
      placeholder: 'foo',
    })

    expectTypeOf(mutationA.data).toEqualTypeOf<number | 'foo'>()
    expectTypeOf(mutationB.data).toEqualTypeOf<number | 'foo'>()

    const mutationC = await useMutation(action, {
      placeholder: 'foo',
    })

    const mutationD = await mutate(action, [1], {
      placeholder: 'foo',
    })

    expectTypeOf(mutationC.data).toEqualTypeOf<number>()
    expectTypeOf(mutationD.data).toEqualTypeOf<number>()
  })

  test('tags', () => {
    const { refreshQueryData } = createQueryClient()

    const sharedTag = tag()
    const numberTag = sharedTag.add<number, 'count'>('count')
    const stringTag = sharedTag.add<string, 'name'>('name')
    const action = (param: number) => param

    refreshQueryData(sharedTag)
    refreshQueryData(numberTag)
    refreshQueryData(stringTag)
    refreshQueryData(action)
    refreshQueryData(action, [2])

    // @ts-expect-error - incorrect number of parameters
    refreshQueryData(action, [2, 3])

    // @ts-expect-error - invalid argument type
    refreshQueryData(action, ['foo'])
  })
})

describe('mutate', () => {
  describe('options', () => {
    test('tags', () => {
      const { mutate } = createQueryClient()

      const action = (value: number) => value

      mutate(action, [1], {
        tags: (context) => {
          expectTypeOf(context.lifecycle).toEqualTypeOf<'before' | 'after'>()
          expectTypeOf(context.payload).toEqualTypeOf<[number]>()

          if (context.lifecycle === 'before') {
            // @ts-expect-error - data does not exist in before lifecycle
            expectTypeOf(context.data)
          }

          if (context.lifecycle === 'after') {
            expectTypeOf(context.data).toEqualTypeOf<number>()
          }

          return []
        },
      })
    })

    test('setQueryDataBefore', () => {
      const { mutate } = createQueryClient()
      const action = vi.fn(() => 'response')
      const numberTag = tag<number>()

      mutate(action, [], {
        tags: [numberTag],
        setQueryDataBefore: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()

          return 1
        },
      })
    })

    test('setQueryDataAfter', () => {
      const { mutate } = createQueryClient()
      const action = vi.fn()
      const numberTag = tag<number>()

      mutate(action, [], {
        tags: [numberTag],
        setQueryDataAfter: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()

          return 1
        },
      })
    })
  })
})

describe('useMutation', () => {
  describe('options', () => {
    test('tags', () => {
      const { useMutation } = createQueryClient()
      const action = (value: number) => value

      useMutation(action, {
        tags: (context) => {
          expectTypeOf(context.lifecycle).toEqualTypeOf<'before' | 'after'>()
          expectTypeOf(context.payload).toEqualTypeOf<[number]>()

          if (context.lifecycle === 'before') {
            // @ts-expect-error - data does not exist in before lifecycle
            expectTypeOf(context.data)
          }

          if (context.lifecycle === 'after') {
            expectTypeOf(context.data).toEqualTypeOf<number>()
          }

          return []
        },
      })
    })

    test('setQueryDataBefore', () => {
      const { useMutation } = createQueryClient()
      const action = vi.fn(() => 'response')
      const numberTag = tag<number>()

      useMutation(action, {
        tags: [numberTag],
        setQueryDataBefore: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()

          return 1
        },
      })
    })

    test('setQueryDataAfter', () => {
      const { useMutation } = createQueryClient()
      const action = vi.fn()
      const numberTag = tag<number>()

      useMutation(action, {
        tags: [numberTag],
        setQueryDataAfter: (data) => {
          expectTypeOf(data).toEqualTypeOf<number>()

          return 1
        },
      })
    })
  })
})

describe('defineMutation', () => {
  test('response', async () => {
    const { defineMutation } = createQueryClient()

    const action = (value: number) => value

    const { mutate, useMutation } = defineMutation(action)

    const mutationA = useMutation()
    const mutationB = mutate([1])

    expectTypeOf(mutationA.data).toEqualTypeOf<number | undefined>()
    expectTypeOf(mutationA.executing).toEqualTypeOf<boolean>()
    expectTypeOf(mutationA.executed).toEqualTypeOf<boolean>()
    expectTypeOf(mutationA.error).toEqualTypeOf<unknown>()
    expectTypeOf(mutationA.errored).toEqualTypeOf<boolean>()

    expectTypeOf(mutationB.executing).toEqualTypeOf<boolean>()
    expectTypeOf(mutationB.executed).toEqualTypeOf<boolean>()
    expectTypeOf(mutationB.error).toEqualTypeOf<unknown>()
    expectTypeOf(mutationB.errored).toEqualTypeOf<boolean>()
    expectTypeOf(mutationB.data).toEqualTypeOf<number | undefined>()

    const mutationC = await useMutation()
    const mutationD = await mutate([1])

    expectTypeOf(mutationC.data).toEqualTypeOf<number>()
    expectTypeOf(mutationD.data).toEqualTypeOf<number>()
  })

  describe('options', () => {
    test('tags', async () => {
      const { defineMutation } = createQueryClient()

      const action = (value: number) => value
      const { mutate, useMutation } = defineMutation(action)

      mutate([1], {
        tags: (context) => {
          expectTypeOf(context.lifecycle).toEqualTypeOf<'before' | 'after'>()
          expectTypeOf(context.payload).toEqualTypeOf<[number]>()

          if (context.lifecycle === 'before') {
            // @ts-expect-error - data does not exist in before lifecycle
            expectTypeOf(context.data)
          }

          if (context.lifecycle === 'after') {
            expectTypeOf(context.data).toEqualTypeOf<number>()
          }

          return []
        },
      })

      useMutation({
        tags: (context) => {
          expectTypeOf(context.lifecycle).toEqualTypeOf<'before' | 'after'>()
          expectTypeOf(context.payload).toEqualTypeOf<[number]>()

          if (context.lifecycle === 'before') {
            // @ts-expect-error - data does not exist in before lifecycle
            expectTypeOf(context.data)
          }

          if (context.lifecycle === 'after') {
            expectTypeOf(context.data).toEqualTypeOf<number>()
          }

          return []
        },
      })
    })

    test('placeholder', async () => {
      const { defineMutation } = createQueryClient()

      const action = (value: number) => value

      const { mutate, useMutation } = defineMutation(action, {
        placeholder: 'foo',
      })

      const mutationA = useMutation()
      const mutationB = mutate([1])

      expectTypeOf(mutationA.data).toEqualTypeOf<number | 'foo'>()
      expectTypeOf(mutationB.data).toEqualTypeOf<number | 'foo'>()

      const mutationC = useMutation({
        placeholder: 'bar',
      })

      const mutationD = mutate([1], {
        placeholder: 'bar',
      })

      expectTypeOf(mutationC.data).toEqualTypeOf<number | 'bar'>()
      expectTypeOf(mutationD.data).toEqualTypeOf<number | 'bar'>()

      const mutationE = await useMutation()
      const mutationF = await mutate([1])

      const mutationG = await useMutation({
        placeholder: 'bar',
      })

      const mutationH = await mutate([1], {
        placeholder: 'bar',
      })

      expectTypeOf(mutationE.data).toEqualTypeOf<number>()
      expectTypeOf(mutationF.data).toEqualTypeOf<number>()
      expectTypeOf(mutationG.data).toEqualTypeOf<number>()
      expectTypeOf(mutationH.data).toEqualTypeOf<number>()
    })
  })
})
