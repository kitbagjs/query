import { expect, test } from 'vitest'
import { getAllTags } from './getAllTags'
import { tag } from './tag'

const tagA = tag()
const tagB = tag()
const tagC = tag<string>()

test('given tags returns all tags', () => {
  const tags = getAllTags([tagA, tagB, tagC], undefined)

  expect(tags).toEqual([tagA, tagB, tagC])
})

test('given a function returns all tags', () => {
  const tags = getAllTags(() => [tagA, tagB, tagC], 'foo')

  expect(tags).toEqual([tagA, tagB, tagC])
})

test('given no tags returns an empty array', () => {
  const tags = getAllTags(undefined, undefined)

  expect(tags).toEqual([])
})
