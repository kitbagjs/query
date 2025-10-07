# Types: AwaitedMutation\<TAction\>

```ts
type AwaitedMutation<TAction> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="data"></a> `data` | [`MutationData`](MutationData.md)\<`TAction`\> |
| <a id="error"></a> `error` | `unknown` |
| <a id="errored"></a> `errored` | `boolean` |
| <a id="executed"></a> `executed` | `boolean` |
| <a id="executing"></a> `executing` | `boolean` |
