# Types: SetQueryData()

```ts
type SetQueryData = {
<TQueryTag>  (tag, setter): void;
<TAction>  (action, setter): void;
<TAction>  (action, parameters, setter): void;
};
```

## Call Signature

```ts
<TQueryTag>(tag, setter): void;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TQueryTag` *extends* [`QueryTag`](QueryTag.md)\<`unknown`\> |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `tag` | `TQueryTag` \| `TQueryTag`[] |
| `setter` | [`QueryDataSetter`](QueryDataSetter.md)\<[`QueryTagType`](QueryTagType.md)\<`TQueryTag`\>\> |

### Returns

`void`

## Call Signature

```ts
<TAction>(action, setter): void;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `TAction` |
| `setter` | [`QueryDataSetter`](QueryDataSetter.md)\<`Awaited`\<`ReturnType`\<`TAction`\>\>\> |

### Returns

`void`

## Call Signature

```ts
<TAction>(
   action, 
   parameters, 
   setter): void;
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
| `setter` | [`QueryDataSetter`](QueryDataSetter.md)\<`Awaited`\<`ReturnType`\<`TAction`\>\>\> |

### Returns

`void`
