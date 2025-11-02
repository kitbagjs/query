# Types: Query\<TAction, TPlaceholder\>

```ts
type Query<TAction, TPlaceholder> = PromiseLike<AwaitedQuery<TAction>> & object;
```

## Type Declaration

### \[dispose\]()

```ts
[dispose]: () => void;
```

#### Returns

`void`

### data

```ts
data: 
  | QueryData<TAction>
| DefaultValue<TPlaceholder, undefined>;
```

### dispose()

```ts
dispose: () => void;
```

#### Returns

`void`

### error

```ts
error: unknown;
```

### errored

```ts
errored: boolean;
```

### execute()

```ts
execute: () => Promise<AwaitedQuery<TAction>>;
```

#### Returns

`Promise`\<[`AwaitedQuery`](AwaitedQuery.md)\<`TAction`\>\>

### executed

```ts
executed: boolean;
```

### executing

```ts
executing: boolean;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TAction` *extends* [`QueryAction`](QueryAction.md) |
| `TPlaceholder` |
