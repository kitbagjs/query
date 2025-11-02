# Types: MutationComposition()

```ts
type MutationComposition = <TAction, TPlaceholder, TTags>(action, options?) => Mutation<TAction, TPlaceholder>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |
| `TPlaceholder` |
| `TTags` *extends* [`MutationTags`](MutationTags.md)\<`TAction`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `TAction` |
| `options?` | [`MutationOptions`](MutationOptions.md)\<`TAction`, `TPlaceholder`, `TTags`\> |

## Returns

[`Mutation`](Mutation.md)\<`TAction`, `TPlaceholder`\>
