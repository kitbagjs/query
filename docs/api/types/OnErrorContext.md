# Types: OnErrorContext\<TAction\>

```ts
type OnErrorContext<TAction> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="error"></a> `error` | `unknown` |
| <a id="payload"></a> `payload` | `Parameters`\<`TAction`\> |
