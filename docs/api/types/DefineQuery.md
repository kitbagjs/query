# Types: DefineQuery()

```ts
type DefineQuery = <TAction, TPlaceholder>(action, options?) => DefinedQuery<TAction, TPlaceholder>;
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
| `options?` | [`QueryOptions`](QueryOptions.md)\<`TAction`, `TPlaceholder`\> |

## Returns

[`DefinedQuery`](DefinedQuery.md)\<`TAction`, `TPlaceholder`\>
