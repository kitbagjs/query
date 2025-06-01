import { expect, test } from 'vitest'
import { createIndexedCollection } from './indexedCollection'

type Person = { id: number, name: string, age: number }

const john = { id: 1, name: 'John', age: 25 }
const jane = { id: 2, name: 'Jane', age: 30 }
const jim = { id: 3, name: 'Jim', age: 35 }
const jack = { id: 4, name: 'Jack', age: 30 }

test('initializes indexes with correct values', () => {
  const items = [
    john,
    jane,
    jim,
    jack,
  ]

  const collection = createIndexedCollection(items, ['name', 'age'])

  expect(collection.getItems('name', 'John')).toEqual([john])
  expect(collection.getItems('name', 'Jane')).toEqual([jane])
  expect(collection.getItems('name', 'Jim')).toEqual([jim])
  expect(collection.getItems('name', 'Jack')).toEqual([jack])
  expect(collection.getItems('age', 25)).toEqual([john])
  expect(collection.getItems('age', 30)).toEqual([jane, jack])
  expect(collection.getItems('age', 35)).toEqual([jim])
})

test('adds item to indexes', () => {
  const collection = createIndexedCollection([
    john,
  ], ['name', 'age'])

  collection.addItem(jane)

  expect(collection.getItems('name', 'John')).toEqual([john])
  expect(collection.getItems('name', 'Jane')).toEqual([jane])
  expect(collection.getItems('age', 25)).toEqual([john])
  expect(collection.getItems('age', 30)).toEqual([jane])
})

test('can be initialized with an empty array', () => {
  const collection = createIndexedCollection<Person>([], ['name', 'age'])

  collection.addItem(john)

  expect(collection.getItems('name', 'John')).toEqual([john])
  expect(collection.getItems('age', 25)).toEqual([john])
})

test('deletes item from indexes', () => {
  const collection = createIndexedCollection([
    john,
    jane,
    jim,
    jack,
  ], ['name', 'age'])

  collection.deleteItems('name', 'John')

  expect(collection.getItems('name', 'John')).toEqual([])
  expect(collection.getItems('age', 25)).toEqual([])

  collection.deleteItems('age', 30)

  expect(collection.getItems('age', 30)).toEqual([])
  expect(collection.getItems('name', 'jane')).toEqual([])
  expect(collection.getItems('name', 'jack')).toEqual([])
})
