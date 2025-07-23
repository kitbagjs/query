# API Reference

Welcome to the @kitbag/query API reference. This section provides detailed documentation for all functions, types, and interfaces available in the library.

## Core Functions

### createQueryClient()

Creates a new query client instance with optional configuration.

**Type Signature:**
```ts
function createQueryClient(options?: ClientOptions): {
  query: QueryClient
  useQuery: <T>(query: Query<T>, options?: UseQueryOptions<T>) => QueryComposition<T>
}
```

**Parameters:**
- `options` (optional): Configuration options for the query client

**Returns:**
- An object containing `query` and `useQuery` functions

### query()

Creates a query function for data fetching.

**Type Signature:**
```ts
function query<TParams extends any[], TData>(
  key: string,
  fetcher: (...params: TParams) => Promise<TData>,
  options?: QueryOptions
): QueryFunction<TParams, TData>
```

**Parameters:**
- `key`: Unique identifier for the query
- `fetcher`: Async function that fetches the data
- `options`: Query configuration options

### useQuery()

Vue composable for using queries with reactive state.

**Type Signature:**
```ts
function useQuery<TData>(
  query: QueryFunction<any[], TData>,
  options?: UseQueryOptions<TData>
): QueryComposition<TData>
```

**Parameters:**
- `query`: A query function created with `query()`
- `options`: Options including params, enabled state, etc.

**Returns:**
- Reactive query state with `data`, `pending`, `error`, and other properties

## Tag System

### tag()

Creates a tag for query invalidation and organization.

**Type Signature:**
```ts
function tag(name: string): QueryTag
```

**Parameters:**
- `name`: Unique identifier for the tag

**Returns:**
- A query tag that can be used for invalidation

## Types

### QueryClient

The main query client interface.

```ts
interface QueryClient {
  // Query management methods
  invalidate(tag: QueryTag): void
  refetch(query: QueryFunction): Promise<void>
  // ... other methods
}
```

### QueryFunction

A function created by `query()` that can be used with `useQuery`.

```ts
type QueryFunction<TParams extends any[], TData> = {
  key: string
  fetcher: (...params: TParams) => Promise<TData>
  options?: QueryOptions
}
```

### QueryComposition

The reactive state returned by `useQuery`.

```ts
interface QueryComposition<TData> {
  data: Ref<TData | undefined>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refetch: () => Promise<void>
  // ... other properties
}
```

### MutationFunction

Function for handling data mutations.

```ts
type MutationFunction<TData, TVariables> = {
  mutate: (variables: TVariables) => Promise<TData>
  pending: Ref<boolean>
  error: Ref<Error | null>
  // ... other properties
}
```

## Configuration Types

### ClientOptions

Configuration options for creating a query client.

```ts
interface ClientOptions {
  // Caching options
  defaultStaleTime?: number
  defaultCacheTime?: number
  
  // Retry options
  defaultRetryCount?: number
  defaultRetryDelay?: number | ((attempt: number) => number)
  
  // Other options...
}
```

### QueryOptions

Options for individual queries.

```ts
interface QueryOptions {
  tags?: QueryTag[]
  staleTime?: number
  cacheTime?: number
  retry?: number | boolean
  // ... other options
}
```

## Error Types

### QueryError

Base error class for query-related errors.

```ts
class QueryError extends Error {
  readonly name = 'QueryError'
  // ... error details
}
```

For more detailed examples and usage patterns, see the [Core Concepts](/core-concepts/query-client) section.