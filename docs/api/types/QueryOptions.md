# Types: QueryOptions\<TAction, TPlaceholder\>

```ts
type QueryOptions<TAction, TPlaceholder> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) | [`QueryAction`](QueryAction.md) |
| `TPlaceholder` | `unknown` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="interval"></a> `interval?` | `number` |
| <a id="onerror"></a> `onError?` | (`error`) => `void` |
| <a id="onsuccess"></a> `onSuccess?` | (`value`) => `void` |
| <a id="placeholder"></a> `placeholder?` | `TPlaceholder` |
| <a id="retries"></a> `retries?` | `number` \| `Partial`\<`RetryOptions`\> |
| <a id="tags"></a> `tags?` | [`QueryTags`](QueryTags.md)\<`TAction`\> |
