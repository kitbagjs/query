# Using syntax

Take advantage of Typescripts [using syntax](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management) to automatically dispose of your query when the function is finished executing.

```ts
function search(): void {
  using catsQuery = await query(searchCats, ['American Shorthair'])

  return catsQuery.data
}
```
