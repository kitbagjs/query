# Types: QueryData\<TAction\>

```ts
type QueryData<TAction> = Awaited<ReturnType<TAction>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) | [`QueryAction`](QueryAction.md) |
