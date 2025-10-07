# Types: MutationTagsContext\<TAction\>

```ts
type MutationTagsContext<TAction> = 
  | MutationTagsBeforeContext<TAction>
| MutationTagsAfterContext<TAction>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) | [`MutationAction`](MutationAction.md) |
