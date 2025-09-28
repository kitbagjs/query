# Types: QueryTagType\<TQueryTag\>

```ts
type QueryTagType<TQueryTag> = TQueryTag extends QueryTag<infer TData> ? TData extends Unset ? unknown : TData : never;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TQueryTag` *extends* [`QueryTag`](QueryTag.md) |
