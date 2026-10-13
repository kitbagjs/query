import { expectTypeOf, test, vi } from 'vitest'
import { QueryTag } from '@/types/tags'
import { createQueryClient } from './createQueryClient'
import { tag } from './tag'

test('tag function returns a QueryTag<never>', () => {
  const value = tag()

  expectTypeOf(value).toExtend<QueryTag>()
  expectTypeOf(value).toEqualTypeOf<QueryTag<never>>()
})

test('tag<T>() returns a typed QueryTag<T>', () => {
  const value = tag<number>()

  expectTypeOf(value).toEqualTypeOf<QueryTag<number>>()
})

test('tag with kinds exposes each kind as a typed descendant tag', () => {
  type User = { id: number }
  type Potato = { genus: string }

  const usersTag = tag<{ user: User, potato: Potato }>(['user', 'potato'])

  expectTypeOf(usersTag.user).toEqualTypeOf<QueryTag<User>>()
  expectTypeOf(usersTag.potato).toEqualTypeOf<QueryTag<Potato>>()
})

test('parent of kinds has union data type', () => {
  type User = { id: number }
  type Potato = { genus: string }

  const usersTag = tag<{ user: User, potato: Potato }>(['user', 'potato'])

  expectTypeOf(usersTag.data).toEqualTypeOf<User | Potato>()
})

test('query from query function with tags callback is called with the query data', () => {
  const { query } = createQueryClient()
  const action = vi.fn(() => 'foo')

  query(action, [], {
    tags: (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()

      return []
    },
  })
})

test('query from query composition with tags callback is called with the query data', () => {
  const { useQuery } = createQueryClient()
  const action = vi.fn(() => 'foo')

  useQuery(action, () => [], {
    tags: (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()

      return []
    },
  })
})
