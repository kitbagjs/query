# Types: QueryActionArgs\<TAction\>

```ts
type QueryActionArgs<TAction> = 
  | MaybeGetter<Parameters<TAction>>
  | Getter<Parameters<TAction> | null>
| Getter<null>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |
