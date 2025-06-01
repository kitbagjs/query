import { expectTypeOf, test, vi } from 'vitest'
import { QueryTag, QueryTagFactory, Unset } from '@/types/tags'
import { createQueryClient } from './createQueryClient'
import { tag } from './tag'

test('tag function returns a tag when no callback is provided', () => {
  const value = tag()

  expectTypeOf(value).toMatchTypeOf<QueryTag>()
})

test('tag function returns a tag factory when a callback is provided', () => {
  const factory = tag((string: string) => string)

  expectTypeOf(factory).toMatchTypeOf<QueryTagFactory<unknown, string>>()

  const value = factory('foo')

  expectTypeOf(value).toMatchTypeOf<QueryTag<Unset>>()
})

test('tag function returns a typed tag when data generic is provided', () => {
  const value = tag<string>()

  expectTypeOf(value).toMatchTypeOf<QueryTag<string>>()
})

test('tag factory returns a typed tag when data generic is provided', () => {
  const factory = tag<string, string>((value: string) => value)

  expectTypeOf(factory).toMatchTypeOf<QueryTagFactory<string, string>>()

  const value = factory('foo')

  expectTypeOf(value).toMatchTypeOf<QueryTag<string>>()
})

test('query from query function with tags callback is called with the query data', () => {
  const { query } = createQueryClient()
  const action = vi.fn(() => 'foo')

  query(action, [], {
    tags: (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()

      return []
    },
  })
})

test('query from query composition with tags callback is called with the query data', () => {
  const { useQuery } = createQueryClient()
  const action = vi.fn(() => 'foo')

  useQuery(action, [], {
    tags: (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()

      return []
    },
  })
})
