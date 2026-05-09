import { expect, test } from 'vitest'
import { tag } from './tag'

test('tags are unique', () => {
  const tag1 = tag()
  const tag2 = tag()

  expect(tag1).not.toBe(tag2)
})

test('tag with kinds exposes each kind as a property tag', () => {
  const usersTag = tag<{ user: { id: number }, potato: { genus: string } }>(['user', 'potato'])

  expect(usersTag.user).toBeDefined()
  expect(usersTag.potato).toBeDefined()
  expect(usersTag.user.key).not.toBe(usersTag.potato.key)
  expect(usersTag.user.key).not.toBe(usersTag.key)
})

test('kind tags carry the parent key as an ancestor', () => {
  const usersTag = tag<{ user: { id: number } }>(['user'])

  expect(usersTag.user.keys).toContain(usersTag.key)
  expect(usersTag.user.keys).toContain(usersTag.user.key)
})

test('tag without kinds has empty kinds array', () => {
  const baseTag = tag()
  const numberTag = tag<number>()

  expect(baseTag.kinds).toEqual([])
  expect(numberTag.kinds).toEqual([])
})

test('tag with kinds reports its kind names', () => {
  const usersTag = tag<{ user: { id: number }, potato: { genus: string } }>(['user', 'potato'])

  expect(usersTag.kinds).toEqual(['user', 'potato'])
})
