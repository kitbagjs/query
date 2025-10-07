# Functions: tag()

## Call Signature

```ts
function tag<TData>(): QueryTag<TData>;
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | *typeof* `unset` |

### Returns

[`QueryTag`](../types/QueryTag.md)\<`TData`\>

## Call Signature

```ts
function tag<TData, TInput>(callback): QueryTagFactory<TData, TInput>;
```

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | *typeof* `unset` |
| `TInput` | `unknown` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | [`QueryTagCallback`](../types/QueryTagCallback.md)\<`TInput`\> |

### Returns

[`QueryTagFactory`](../types/QueryTagFactory.md)\<`TData`, `TInput`\>
