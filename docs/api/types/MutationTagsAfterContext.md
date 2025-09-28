# Types: MutationTagsAfterContext\<TAction\>

```ts
type MutationTagsAfterContext<TAction> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) | [`MutationAction`](MutationAction.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="data"></a> `data` | [`MutationData`](MutationData.md)\<`TAction`\> |
| <a id="lifecycle"></a> `lifecycle` | `"after"` |
| <a id="payload"></a> `payload` | `Parameters`\<`TAction`\> |
