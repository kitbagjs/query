# Types: MutationFunction()

```ts
type MutationFunction = <TAction, TPlaceholder, TTags>(action, args, options?) => PromiseLike<AwaitedMutation<TAction>> & Mutation<TAction, TPlaceholder>;
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
| `args` | `Parameters`\<`TAction`\> |
| `options?` | [`MutationOptions`](MutationOptions.md)\<`TAction`, `TPlaceholder`, `TTags`\> |

## Returns

`PromiseLike`\<[`AwaitedMutation`](AwaitedMutation.md)\<`TAction`\>\> & [`Mutation`](Mutation.md)\<`TAction`, `TPlaceholder`\>
