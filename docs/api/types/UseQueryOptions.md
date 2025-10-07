# Types: UseQueryOptions\<TAction, TPlaceholder\>

```ts
type UseQueryOptions<TAction, TPlaceholder> = QueryOptions<TAction, TPlaceholder> & object;
```

## Type Declaration

### immediate?

```ts
optional immediate: boolean;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) | [`QueryAction`](QueryAction.md) |
| `TPlaceholder` | `unknown` |
