# Types: DefinedMutationComposition()\<TDefinedAction, TDefinedPlaceholder\>

```ts
type DefinedMutationComposition<TDefinedAction, TDefinedPlaceholder> = <TPlaceholder, TTags>(options?) => Mutation<TDefinedAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TDefinedAction` *extends* [`MutationAction`](MutationAction.md) |
| `TDefinedPlaceholder` |

## Type Parameters

| Type Parameter |
| ------ |
| `TPlaceholder` |
| `TTags` *extends* [`MutationTags`](MutationTags.md)\<`TDefinedAction`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`MutationOptions`](MutationOptions.md)\<`TDefinedAction`, `TPlaceholder`, `TTags`\> |

## Returns

[`Mutation`](Mutation.md)\<`TDefinedAction`, `DefaultValue`\<`TPlaceholder`, `TDefinedPlaceholder`\>\>
