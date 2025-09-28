# Types: DefineMutation()

```ts
type DefineMutation = <TAction, TPlaceholder, TTags>(action, options?) => DefinedMutation<TAction, TPlaceholder>;
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

[`DefinedMutation`](DefinedMutation.md)\<`TAction`, `TPlaceholder`\>
