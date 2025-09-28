# Types: DefinedQuery\<TAction, TPlaceholder\>

```ts
type DefinedQuery<TAction, TPlaceholder> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |
| `TPlaceholder` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="query"></a> `query` | [`DefinedQueryFunction`](DefinedQueryFunction.md)\<`TAction`, `TPlaceholder`\> |
| <a id="usequery"></a> `useQuery` | [`DefinedQueryComposition`](DefinedQueryComposition.md)\<`TAction`, `TPlaceholder`\> |
