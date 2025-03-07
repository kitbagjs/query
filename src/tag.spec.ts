import { expect, test } from "vitest";
import { tag } from "./tag";

test('tags are unique', () => {
  const tag1 = tag('test')
  const tag2 = tag('test')

  expect(tag1).not.toBe(tag2)
})

test('tag factories are unique', () => {
  const factory1 = tag('test', (string: string) => string)
  const factory2 = tag('test', (string: string) => string)
  const value1 = factory1('foo')
  const value2 = factory2('foo')

  expect(value1).not.toBe(value2)
})

test('tag factories return the same tag name and id', () => {
  const factory = tag('test', (string: string) => string)
  const value1 = factory('foo')
  const value2 = factory('bar')

  expect(value1.name).toBe('test')
  expect(value2.name).toBe('test')
})