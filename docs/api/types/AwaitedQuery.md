# Types: AwaitedQuery\<TAction\>

```ts
type AwaitedQuery<TAction> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="dispose"></a> `[dispose]` | () => `void` |
| <a id="data"></a> `data` | [`QueryData`](QueryData.md)\<`TAction`\> |
| <a id="dispose-1"></a> `dispose` | () => `void` |
| <a id="error"></a> `error` | `unknown` |
| <a id="errored"></a> `errored` | `boolean` |
| <a id="execute"></a> `execute` | () => `Promise`\<`AwaitedQuery`\<`TAction`\>\> |
| <a id="executed"></a> `executed` | `boolean` |
| <a id="executing"></a> `executing` | `boolean` |
