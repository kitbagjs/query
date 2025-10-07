# Types: QueryFunction()

```ts
type QueryFunction = <TAction, TPlaceholder>(action, args, options?) => Query<TAction, TPlaceholder>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |
| `TPlaceholder` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `TAction` |
| `args` | `Parameters`\<`TAction`\> |
| `options?` | [`QueryOptions`](QueryOptions.md)\<`TAction`, `TPlaceholder`\> |

## Returns

[`Query`](Query.md)\<`TAction`, `TPlaceholder`\>
