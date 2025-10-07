# Types: SetQueryDataAfterContext\<TAction\>

```ts
type SetQueryDataAfterContext<TAction> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="data"></a> `data` | [`MutationData`](MutationData.md)\<`TAction`\> |
| <a id="payload"></a> `payload` | `Parameters`\<`TAction`\> |
