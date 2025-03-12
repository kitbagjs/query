import { expectTypeOf, test, vi } from "vitest";
import { QueryTag, QueryTagFactory } from "@/types/tags";
import { createQueryClient } from "./createQueryClient";
import { ExtractQueryOptionsFromQuery } from "./types/query";
import { tag } from "./tag";

test('tag function returns a tag when no callback is provided', () => {
  const value = tag('test')

  expectTypeOf(value).toMatchTypeOf<QueryTag<'test'>>()  
})

test('tag function returns a tag factory when a callback is provided', () => {
  const factory = tag('test', (string: string) => string)

  expectTypeOf(factory).toMatchTypeOf<QueryTagFactory<'test',string>>()

  const value = factory('foo')

  expectTypeOf(value).toMatchTypeOf<QueryTag<'test'>>()
})

test('query from query function with tags are preserved', () => {
  const { query } = createQueryClient()
  const action = vi.fn()
  const tag1 = tag('tag1')
  const tag2 = tag('tag2')

  const value = query(action, [], {
    tags: [tag1, tag2]
  })

  type Source = ExtractQueryOptionsFromQuery<typeof value>['tags']
  type Expected = [QueryTag<'tag1'>, QueryTag<'tag2'>]

  expectTypeOf<Source>().toMatchTypeOf<Expected>()
})

test('query from query function with tags callback is called with the query data', () => {
  const { query } = createQueryClient()
  const action = vi.fn(() => 'foo')

  query(action, [], {
    tags: (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()

      return []
    }
  })
})

test('query from query composition with tags are preserved', () => {
  const { useQuery } = createQueryClient()
  const action = vi.fn()
  const tag1 = tag('tag1')
  const tag2 = tag('tag2')

  const value = useQuery(action, [], {
    tags: [tag1, tag2]
  })

  type Source = ExtractQueryOptionsFromQuery<typeof value>['tags']
  type Expected = [QueryTag<'tag1'>, QueryTag<'tag2'>]

  expectTypeOf<Source>().toMatchTypeOf<Expected>()
})

test('query from query composition with tags callback is called with the query data', () => {
  const { useQuery } = createQueryClient()
  const action = vi.fn(() => 'foo')

  useQuery(action, [], {
    tags: (data) => {
      expectTypeOf(data).toMatchTypeOf<string>()

      return []
    }
  })
})

test('query from defined query with tags are preserved', () => {
  const { defineQuery } = createQueryClient()
  const action = vi.fn()
  const tag1 = tag('tag1')
  const tag2 = tag('tag2')

  const { query } = defineQuery(action, {
    tags: [tag1, tag2]
  })

  const value = query([])

  type Source = ExtractQueryOptionsFromQuery<typeof value>['tags']
  type Expected = [QueryTag<'tag1'>, QueryTag<'tag2'>]

  expectTypeOf<Source>().toMatchTypeOf<Expected>()
})

test('query from defined query composition with tags are preserved', () => {
  const { defineQuery } = createQueryClient()
  const action = vi.fn()
  const tag1 = tag('tag1')
  const tag2 = tag('tag2')

  const { useQuery } = defineQuery(action, {
    tags: [tag1, tag2]
  })

  const value = useQuery([])

  type Source = ExtractQueryOptionsFromQuery<typeof value>['tags']
  type Expected = [QueryTag<'tag1'>, QueryTag<'tag2'>]

  expectTypeOf<Source>().toMatchTypeOf<Expected>()
})