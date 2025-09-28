# Types: MutationData\<TAction\>

```ts
type MutationData<TAction> = Awaited<ReturnType<TAction>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |
