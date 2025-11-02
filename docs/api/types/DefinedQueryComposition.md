# Types: DefinedQueryComposition()\<TAction, TDefinedPlaceholder\>

```ts
type DefinedQueryComposition<TAction, TDefinedPlaceholder> = <TPlaceholder>(args, options?) => Query<TAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |
| `TDefinedPlaceholder` |

## Type Parameters

| Type Parameter |
| ------ |
| `TPlaceholder` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`QueryActionArgs`](QueryActionArgs.md)\<`TAction`\> |
| `options?` | [`QueryOptions`](QueryOptions.md)\<`TAction`, `TPlaceholder`\> |

## Returns

[`Query`](Query.md)\<`TAction`, `DefaultValue`\<`TPlaceholder`, `TDefinedPlaceholder`\>\>
