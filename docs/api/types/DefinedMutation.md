# Types: DefinedMutation\<TAction, TPlaceholder\>

```ts
type DefinedMutation<TAction, TPlaceholder> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |
| `TPlaceholder` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="mutate"></a> `mutate` | [`DefinedMutationFunction`](DefinedMutationFunction.md)\<`TAction`, `TPlaceholder`\> |
| <a id="usemutation"></a> `useMutation` | [`DefinedMutationComposition`](DefinedMutationComposition.md)\<`TAction`, `TPlaceholder`\> |
