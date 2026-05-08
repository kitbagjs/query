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

test('tag.add<T>() returns a typed descendant', () => {
  const baseTag = tag()
  const userTag = baseTag.add<{ id: number }>()

  expectTypeOf(userTag).toEqualTypeOf<QueryTag<{ id: number }>>()
})

test('descendants nest arbitrarily deep', () => {
  const baseTag = tag()
  const userTag = baseTag.add<{ id: number }>()
  const userAvatarTag = userTag.add<{ id: number, url: string }>()

  expectTypeOf(userAvatarTag).toEqualTypeOf<QueryTag<{ id: number, url: string }>>()
})

test('descendant data must be assignable to ancestor data', () => {
  type User = { id: number }
  type UserImage = { id: number, url: string }
  type UserDetails = { id: number, bio: string }

  const usersTag = tag<User | UserImage | UserDetails>()

  expectTypeOf(usersTag.add<User>()).toEqualTypeOf<QueryTag<User>>()
  expectTypeOf(usersTag.add<UserImage>()).toEqualTypeOf<QueryTag<UserImage>>()
  expectTypeOf(usersTag.add<UserDetails>()).toEqualTypeOf<QueryTag<UserDetails>>()
})

test('descendant with data not assignable to ancestor is rejected', () => {
  const userTag = tag<{ id: number }>()

  // @ts-expect-error - { unrelated: true } is not assignable to { id: number }
  userTag.add<{ unrelated: true }>()
})

test('untyped root places no constraint on descendants', () => {
  const baseTag = tag()

  expectTypeOf(baseTag.add<number>()).toEqualTypeOf<QueryTag<number>>()
  expectTypeOf(baseTag.add<{ anything: true }>()).toEqualTypeOf<QueryTag<{ anything: true }>>()
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
