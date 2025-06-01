import { expect, test } from 'vitest'
import { getAllTags } from './getAllTags'
import { tag } from './tag'

const tagA = tag()
const tagB = tag()
const tagC = tag((input: string) => input)

test('given tags returns all tags', () => {
  const tags = getAllTags([tagA, tagB, tagC('foo')], undefined)

  expect(tags).toEqual([tagA, tagB, tagC('foo')])
})

test('given a function returns all tags', () => {
  const tags = getAllTags((input: string) => [tagA, tagB, tagC(input)], 'foo')

  expect(tags).toEqual([tagA, tagB, tagC('foo')])
})

test('given no tags returns an empty array', () => {
  const tags = getAllTags(undefined, undefined)

  expect(tags).toEqual([])
})
