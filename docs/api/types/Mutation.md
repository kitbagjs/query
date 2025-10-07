# Types: Mutation\<TAction, TPlaceholder\>

```ts
type Mutation<TAction, TPlaceholder> = PromiseLike<AwaitedMutation<TAction>> & object;
```

## Type Declaration

### data

```ts
data: 
  | MutationData<TAction>
| DefaultValue<TPlaceholder, undefined>;
```

### error

```ts
error: unknown;
```

### errored

```ts
errored: boolean;
```

### executed

```ts
executed: boolean;
```

### executing

```ts
executing: boolean;
```

### mutate()

```ts
mutate: (...args) => Promise<MutationData<TAction>>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`args` | `Parameters`\<`TAction`\> |

#### Returns

`Promise`\<[`MutationData`](MutationData.md)\<`TAction`\>\>

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`MutationAction`](MutationAction.md) |
| `TPlaceholder` |
