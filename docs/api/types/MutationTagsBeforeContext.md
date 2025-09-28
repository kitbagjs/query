# Types: MutationTagsBeforeContext\<TAction\>

```ts
type MutationTagsBeforeContext<TAction> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) | [`MutationAction`](MutationAction.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="lifecycle"></a> `lifecycle` | `"before"` |
| <a id="payload"></a> `payload` | `Parameters`\<`TAction`\> |
