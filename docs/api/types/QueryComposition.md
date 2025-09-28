# Types: QueryComposition()

```ts
type QueryComposition = <TAction, Args, TPlaceholder>(action, args, options?) => Query<TAction, TPlaceholder>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |
| `Args` *extends* [`QueryActionArgs`](QueryActionArgs.md)\<`TAction`\> |
| `TPlaceholder` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `TAction` |
| `args` | `Args` |
| `options?` | [`UseQueryOptions`](UseQueryOptions.md)\<`TAction`, `TPlaceholder`\> |

## Returns

[`Query`](Query.md)\<`TAction`, `TPlaceholder`\>
