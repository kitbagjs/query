import { expect, test } from 'vitest'
import { tag } from './tag'

test('tags are unique', () => {
  const tag1 = tag()
  const tag2 = tag()

  expect(tag1).not.toBe(tag2)
})

test('tag.add returns a new descendant tag', () => {
  const baseTag = tag()
  const userTag = baseTag.add<number>()

  expect(userTag).toBeDefined()
  expect(userTag.key).not.toBe(baseTag.key)
})

test('descendants carry their ancestor keys', () => {
  const baseTag = tag()
  const userTag = baseTag.add<number>()

  expect(userTag.keys).toContain(baseTag.key)
  expect(userTag.keys).toContain(userTag.key)
})

test('chained .add calls accumulate ancestor keys', () => {
  const baseTag = tag()
  const userTag = baseTag.add<{ id: number }>()
  const deepTag = userTag.add<{ id: number, label: string }>()

  expect(deepTag.keys).toContain(baseTag.key)
  expect(deepTag.keys).toContain(userTag.key)
  expect(deepTag.keys).toContain(deepTag.key)
})
