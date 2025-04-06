import { expect, test } from "vitest";
import { createIndexedCollection } from "./indexedCollection";

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
  ];

  const collection = createIndexedCollection(items, ['name', 'age']);

  expect(collection.findItem('name', 'John')).toEqual([john]);
  expect(collection.findItem('name', 'Jane')).toEqual([jane]);
  expect(collection.findItem('name', 'Jim')).toEqual([jim]);
  expect(collection.findItem('name', 'Jack')).toEqual([jack]);
  expect(collection.findItem('age', 25)).toEqual([john]);
  expect(collection.findItem('age', 30)).toEqual([jane, jack]);
  expect(collection.findItem('age', 35)).toEqual([jim]);
});

test('adds item to indexes', () => {
  const collection = createIndexedCollection([
    john,
  ], ['name', 'age']);

  collection.addItem(jane);

  expect(collection.findItem('name', 'John')).toEqual([john]);
  expect(collection.findItem('name', 'Jane')).toEqual([jane]);
  expect(collection.findItem('age', 25)).toEqual([john]);
  expect(collection.findItem('age', 30)).toEqual([jane]);
});

test('can be initialized with an empty array', () => {
  const collection = createIndexedCollection<Person>([], ['name', 'age']);

  collection.addItem(john);

  expect(collection.findItem('name', 'John')).toEqual([john]);
  expect(collection.findItem('age', 25)).toEqual([john]);
});

test('deletes item from indexes', () => {
  const collection = createIndexedCollection([
    john,
    jane,
    jim,
    jack,
  ], ['name', 'age']);

  collection.deleteItem('name', 'John');

  expect(collection.findItem('name', 'John')).toEqual([]);
  expect(collection.findItem('name')).toEqual([jane, jim, jack]);
  expect(collection.findItem('age', 25)).toEqual([]);
  expect(collection.findItem('age')).toEqual([jane, jim, jack]);
  
  collection.deleteItem('age', 30);

  expect(collection.findItem('age')).toEqual([jim]);
  expect(collection.findItem('name')).toEqual([jim]);
});