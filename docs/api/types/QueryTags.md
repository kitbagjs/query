# Types: QueryTags\<TAction\>

```ts
type QueryTags<TAction> = 
  | QueryTag<QueryData<TAction> | Unset>[]
  | (value) => QueryTag<QueryData<TAction> | Unset>[];
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) | [`QueryAction`](QueryAction.md) |
