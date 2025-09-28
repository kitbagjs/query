# Types: DefinedMutationFunction()\<TDefinedAction, TDefinedPlaceholder\>

```ts
type DefinedMutationFunction<TDefinedAction, TDefinedPlaceholder> = <TPlaceholder, TTags>(args, options?) => Mutation<TDefinedAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>;
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
| `args` | `Parameters`\<`TDefinedAction`\> |
| `options?` | [`MutationOptions`](MutationOptions.md)\<`TDefinedAction`, `TPlaceholder`, `TTags`\> |

## Returns

[`Mutation`](Mutation.md)\<`TDefinedAction`, `DefaultValue`\<`TPlaceholder`, `TDefinedPlaceholder`\>\>
