# Queries

Queries are the foundation of data fetching in Kitbag query. Queries are highly customizable and provide a simple but effective API for accessing the state of your data.

## Query Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| undefined` | The resolved data from the query action. Will be `undefined` when the function hasn't yet completed. If the query is awaited, `data` will be `T`. |
| `error` | `unknown` | Any error that occurred during execution. |
| `errored` | `boolean` | Whether the query has encountered an error. |
| `executed` | `boolean` | Whether the query has been executed at least once. |
| `executing` | `boolean` | Whether the query is currently executing. |
| `execute` | `(...args) => Promise<T>` | Function to manually trigger the query. Accepts arguments to use when calling your function, will override arguments supplied when creating the query. |
| `dispose` | `() => void` | Function to clean up the query and its resources. |

### Execute

The query includes `execute`, which can be called at any point to force the function to be called again. Execute optionally takes the arguments that match the arguments on the function. If supplied, these arguments will override whatever arguments were supplied when creating the query.

```ts
const messageFeedQuery = query(getMessages, () => null, { immediate: false })

const newMessages = await messageFeedQuery.execute(Date.now())
```

### Awaiting Queries

When creating a query, you have the option of using `await` which changes the `data` attribute from being `T | undefined` to `T` since we can be sure that your function has executed.

```ts
const regularQuery = await query(getMessages, () => Date.now())
//      ^? data: Message[] | undefined
const awaitedQuery = await query(getMessages, () => Date.now())
//      ^? data: Message[]
```

### Using syntax

Take advantage of Typescripts [using syntax](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management) to automatically dispose of your query when the function is finished executing.

```ts
function exampleCallback(): void {
  using query = await query(getMessages, () => Date.now())

  return query.data
}
```

## Query Options

| Option | Type | Description |
|--------|------|-------------|
| `placeholder` | `TPlaceholder` | Default value to show while the query is loading. |
| `onSuccess` | `(value: T) => void` | Callback function called when the query succeeds. Provides the value `T` returned from the function. |
| `onError` | `(error: unknown) => void` | Callback function called when the query fails. Provides the error `unknown` thrown by the function. |
| `interval` | `number` | Time in milliseconds between automatic re-fetches. |
| `retries` | `number \| Partial<RetryOptions>` | Number of retry attempts or retry configuration. |
| `tags` | `QueryTags` | Tags for cache invalidation and management. |

### Placeholder

By default a query that hasn't been executed (or hasn't finished executing) will use `undefined` for the `data`. However, this can be overridden with anything you wish.

```ts
const placeholder: Message[] = []
const messagesQuery = await query(getMessages, () => Date.now(), { placeholder })
//      ^? data: Message[]
```

### Interval

Automatically re-trigger the function on an interval. Value provided is time in milliseconds.

```ts
const messagesQuery = await query(getMessages, () => Date.now(), { interval: 30_000 })
// automatically calls `getMessages` when query is created, and then again every 30 seconds
```

### Retries

Automatically re-try the function when an error occurs. By default the query will wait `500` milliseconds between retries.

```ts
const connectionQuery = query(makeConnection, [token], { retries: 3 })
// will try to call `makeConnection` a total of 3 times, waiting 500 MS between each attempt
```

Alternatively you can pass in `RetryOptions`, which allows you to specify both a `count` and a `delay`.

```ts
const retries = { count: 1, delay: 1_000 }
const connectionQuery = query(makeConnection, [token], { retries: 3 })
// will retry after 1,000 MS once if initial call fails
```

### Tags

Tags are used to organize queries and mutations that are related. Tags can be used to access cached values, update cache values, and trigger cache invalidation.

## UseQuery method

The `useQuery` function adds some super useful, vue specific functionality you'd expect from a [composition](https://vuejs.org/guide/extras/composition-api-faq.html).

### Parameters argument is reactive

When parameters for your query function change, the query is automatically updated. The query is suspended while parameters are `null`, this enables you to create your query even when waiting on required arguments.

```ts
const selectedUserId = ref<string | undefined>()

const userQuery = useQuery(fetchUser, () => selectedUserId.value ? [selectedUserId.value] : null)
```

### Delayed execution

Queries will always wait if the parameters aren't ready, but you can also setup a query to always delay execution of the function until you either call `execute()` on the query, or change the reactive parameters argument.

### Automatic cleanup

When your component is unmounted, any queries are automatically disposed.

## DefineQuery method

```ts
// Regular query - configure per usage
const userQuery = query('user', fetchUser)
const user1 = useQuery(userQuery, { params: [1], staleTime: 60000 })
const user2 = useQuery(userQuery, { params: [2], staleTime: 120000 })

// defineQuery - consistent configuration  
const { useQuery: useUserQuery } = defineQuery(fetchUser, { staleTime: 60000 })
const user1 = useUserQuery([1]) // Uses predefined staleTime
const user2 = useUserQuery([2]) // Uses predefined staleTime
```

**Perfect for:**

- **API layers** - Export both raw functions and pre-configured queries
- **Shared query configuration** - Common settings across related queries  
- **Component libraries** - Provide ready-to-use composables
- **Team consistency** - Enforce caching and retry policies

**Use regular `query` when:**

- You need different options per usage
- Simple one-off queries
- You're using the default client (which doesn't have `defineQuery`)
