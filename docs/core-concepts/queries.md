# Queries

Queries are the foundation of data fetching in Kitbag query. Queries are highly customizable and provide a simple but effective API for accessing the state of your data.

```ts
import { query } from '@kitbag/query'

function searchCats(breed?: string) {
  ...
}

const catsQuery = query(searchCats, ['Maine Coon'])
```

## Query Properties

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| undefined` | The resolved data from the query action. Will be `undefined` when the function hasn't yet completed. If the query is awaited, `data` will be `T`. |
| `error` | `unknown` | Any error that occurred during execution. |
| `errored` | `boolean` | Whether the query has encountered an error. |
| `executed` | `boolean` | Whether the query has been executed at least once. |
| `executing` | `boolean` | Whether the query is currently executing. |
| `execute` | `() => Promise<T>` | Function to manually trigger the query. |
| `dispose` | `() => void` | Function to clean up the query and its resources. |

### Execute

The query includes `execute`, which can be called at any point to force the function to be called again.

```ts
const catsQuery = query(searchCats, ['Ragdoll'])

const cats = await catsQuery.execute()
//     ^? data: Cat[]
```

### Awaiting Queries

When creating a query, you have the option of using `await` which changes the `data` attribute from being `T | undefined` to `T` since we can be sure that your function has executed.

::: warning Error Handling
Note that if awaiting a query, any errors that occur will be thrown. Consider placing your `await query(...)` inside a try catch block.
:::

```ts
const regularQuery = await query(searchCats, ['Persian'])
//     ^? data: Cat[] | undefined
const awaitedQuery = await query(searchCats, ['Persian'])
//     ^? data: Cat[]
```

### Using syntax

Take advantage of Typescripts [using syntax](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management) to automatically dispose of your query when the function is finished executing.

```ts
function search(): void {
  using catsQuery = await query(searchCats, ['American Shorthair'])

  return catsQuery.data
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
const placeholder: Cat[] = []
const catsQuery = await query(searchCats, ['Bengal'], { placeholder })
//     ^? data: Cat[]
```

### Interval

Automatically re-trigger the function on an interval. Value provided is time in milliseconds.

```ts
const catsQuery = await query(searchCats, ['Persian'], { interval: 30_000 })
// automatically calls `searchCats` when query is created, and then again every 30 seconds
```

### Retries

Automatically re-try the function when an error occurs. By default the query will wait `500` milliseconds between retries.

```ts
const catsQuery = query(searchCats, ['Siamese'], { retries: 3 })
// will try to call `searchCats` a total of 3 times, waiting 500 MS between each attempt
```

Alternatively you can pass in `RetryOptions`, which allows you to specify both a `count` and a `delay`.

```ts
const retries = { count: 1, delay: 1_000 }
const catsQuery = query(searchCats, ['Siamese'], { retries: 3 })
// will retry after 1,000 MS once if initial call fails
```

### Tags

Tags are used to organize queries and mutations that are related. Tags can be used to access cached values, update cache values, and trigger cache invalidation.

## UseQuery method

The `useQuery` function adds some super useful, vue specific functionality you'd expect from a [composition](https://vuejs.org/guide/extras/composition-api-faq.html).

### Parameters argument is reactive

When parameters for your query function change, the query is automatically updated. 

```ts
import { useQuery } from '@kitbag/query'

const selectedBreed = ref<string | undefined>()

const catsQuery = useQuery(searchCats, () => [selectedBreed.value])
```

### Delayed execution

The query is suspended while parameters are `null`, this enables you to create your query even when waiting on required arguments.

```ts
const selectedBreed = ref<string | undefined>()

const catsQuery = useQuery(searchCats, () => {
  if (!selectedBreed.value) {
    return null
  }
  
  return [selectedBreed.value]
})
```

You can also setup a query NOT to execute immediately. These queries wait until you either call `execute()`, or change the reactive parameters argument.

```ts
const selectedBreed = ref<string | undefined>()

const catsQuery = useQuery(searchCats, () => [selectedBreed.value], { immediate: false })
```

### Automatic cleanup

When your component is unmounted, any queries are automatically disposed.

## DefineQuery method

The `defineQuery` function adds the ability to pre-configure your queries into query factories. Defined queries abstract out the need to define which `action`, as well as optionally providing a default set of query options.

::: code-group

```ts [services/catApi.ts]
import { defineQuery } from '@kitbag/query'

export searchCats(breed?: string) { ... }

const { query: catsQuery, useQuery: useCatsQuery } = defineQuery(searchCats)

export { catsQuery, useCatsQuery }
```

```ts [components/CatFinder.vue]
import { useCatsQuery } from '@/services/catApi'

const selectedBreed = ref<string | undefined>()

const catsQuery = useCatsQuery(() => [selectedBreed.value])
```

:::

**Perfect for:**

- **API layers** - Export both raw functions and pre-configured queries
- **Shared query configuration** - Common settings across related queries  
- **Component libraries** - Provide ready-to-use composables
- **Team consistency** - Enforce caching and retry policies
