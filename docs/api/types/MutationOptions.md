# Types: MutationOptions\<TAction, TPlaceholder, TTags\>

```ts
type MutationOptions<TAction, TPlaceholder, TTags> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) | [`MutationAction`](MutationAction.md) |
| `TPlaceholder` | `unknown` |
| `TTags` *extends* [`MutationTags`](MutationTags.md)\<`TAction`\> | [`MutationTags`](MutationTags.md)\<`TAction`\> |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="onerror"></a> `onError?` | (`context`) => `void` |
| <a id="onexecute"></a> `onExecute?` | (`context`) => `void` |
| <a id="onsuccess"></a> `onSuccess?` | (`context`) => `void` |
| <a id="placeholder"></a> `placeholder?` | `TPlaceholder` |
| <a id="refreshquerydata"></a> `refreshQueryData?` | `boolean` |
| <a id="retries"></a> `retries?` | `number` \| `Partial`\<`RetryOptions`\> |
| <a id="setquerydataafter"></a> `setQueryDataAfter?` | (`queryData`, `context`) => [`MutationTagsType`](MutationTagsType.md)\<`TTags`\> |
| <a id="setquerydatabefore"></a> `setQueryDataBefore?` | (`queryData`, `context`) => [`MutationTagsType`](MutationTagsType.md)\<`TTags`\> |
| <a id="tags"></a> `tags?` | `TTags` |
