import { createQueryGroupTags } from './createQueryGroupTags'
import { test, expect } from 'vitest'
import { tag } from '@/tag'

test('should add and check tags correctly', () => {
  const tags = createQueryGroupTags()
  const tag1 = tag()

  tags.addAllTags([tag1], 1)

  expect(tags.has(tag1)).toBe(true)
})

test('should remove tags correctly', () => {
  const tags = createQueryGroupTags()
  const tag1 = tag()

  tags.addAllTags([tag1], 1)
  tags.removeAllTagsByQueryId(1)

  expect(tags.has(tag1)).toBe(false)
})

test('should handle multiple tags and ids', () => {
  const tags = createQueryGroupTags()
  const tag1 = tag()
  const tag2 = tag()

  tags.addAllTags([tag1, tag2], 1)
  tags.addAllTags([tag1], 2)

  expect(tags.has(tag1)).toBe(true)
  expect(tags.has(tag2)).toBe(true)

  tags.removeAllTagsByQueryId(1)

  expect(tags.has(tag2)).toBe(false)
  expect(tags.has(tag1)).toBe(true)
})

test('should clear all tags', () => {
  const tags = createQueryGroupTags()
  const tag1 = tag()
  const tag2 = tag()
  const tag3 = tag()

  tags.addAllTags([tag1, tag2], 1)
  tags.addAllTags([tag1, tag2, tag3], 2)
  tags.clear()

  expect(tags.has(tag1)).toBe(false)
  expect(tags.has(tag2)).toBe(false)
  expect(tags.has(tag3)).toBe(false)
})

test('should handle undefined tags gracefully', () => {
  const groupTags = createQueryGroupTags()

  expect(() => {
    groupTags.addAllTags(undefined, 1)
  }).not.toThrow()
})
