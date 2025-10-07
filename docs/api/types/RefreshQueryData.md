# Types: RefreshQueryData()

```ts
type RefreshQueryData = {
<TQueryTag>  (tag): void;
  (action): void;
<TAction>  (action, parameters): void;
};
```

## Call Signature

```ts
<TQueryTag>(tag): void;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TQueryTag` *extends* [`QueryTag`](QueryTag.md)\<`unknown`\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `tag` | `TQueryTag` \| `TQueryTag`[] |

### Returns

`void`

## Call Signature

```ts
(action): void;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | [`QueryAction`](QueryAction.md) |

### Returns

`void`

## Call Signature

```ts
<TAction>(action, parameters): void;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `TAction` |
| `parameters` | `Parameters`\<`TAction`\> |

### Returns

`void`
