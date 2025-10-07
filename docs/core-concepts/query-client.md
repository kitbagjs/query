# Query Client

<!-- The query client is the central hub of Kitbag query. It manages all your queries, handles caching, and provides the composables you'll use throughout your application.

## Getting Started: Use the Default Client

For most applications, you should start with the default, ready-to-use client:

```ts
import { query, useQuery } from '@kitbag/query'

// Ready to use - comes pre-configured!
const userQuery = query('user', fetchUser)
const user = useQuery(userQuery, { params: [userId] })
```

> **Recommended Approach**: The default client provides shared caching, unified query management, and enables powerful features like tag-based invalidation across your entire application. This is sufficient for 95% of use cases.

## When to Create Your Own Client

Create a custom query client only when you need:

- **Custom configuration** for your entire app
- **Multiple isolated contexts** (e.g., different APIs with different caching strategies)  
- **Mutations and advanced features** like `defineQuery`
- **Tag-based invalidation** that should work across specific query groups

```ts
import { createQueryClient } from '@kitbag/query'

// Custom client with configuration
export const { query, useQuery, defineQuery, mutate } = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000, // 5 minutes
  defaultCacheTime: 10 * 60 * 1000, // 10 minutes
  defaultRetryCount: 3
})
```

## Configuration Options

The query client accepts several configuration options:

### Caching Options

- **defaultStaleTime**: How long data is considered fresh (default: 0)
- **defaultCacheTime**: How long unused data stays in cache (default: 5 minutes)

```ts
const { query, useQuery } = createQueryClient({
  defaultStaleTime: 2 * 60 * 1000,    // Data is fresh for 2 minutes
  defaultCacheTime: 10 * 60 * 1000    // Keep in cache for 10 minutes
})
```

### Retry Options

- **defaultRetryCount**: Number of retry attempts on failure (default: 3)
- **defaultRetryDelay**: Delay between retries (default: exponential backoff)

```ts
const { query, useQuery } = createQueryClient({
  defaultRetryCount: 5,
  defaultRetryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
})
```

## What You Get

The `createQueryClient()` function returns an object with two main properties:

### query

A function for creating query definitions. This is where you define your data fetching logic:

```ts
const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})
```

### useQuery

A Vue composable for using queries in your components:

```ts
const user = useQuery(userQuery, {
  params: [userId]
})
```

## Multiple Query Clients

You can create multiple query clients for different purposes:

```ts
// Main application data
export const { query: appQuery, useQuery: useAppQuery } = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000
})

// Real-time data with shorter cache times
export const { query: realtimeQuery, useQuery: useRealtimeQuery } = createQueryClient({
  defaultStaleTime: 10 * 1000,
  defaultCacheTime: 30 * 1000
})
```

## Default vs Custom vs Multiple Clients

### Default Client (Recommended for Most Apps)

Start here - use the default client that comes pre-configured:

```ts
// queries/users.ts
import { query, useQuery } from '@kitbag/query'

export const userQuery = query('user', fetchUser)
```

```ts  
// components/UserProfile.vue
import { useQuery } from '@kitbag/query'
import { userQuery } from '../queries/users'

const user = useQuery(userQuery, { params: [userId] })
```

**Benefits:**
- Zero configuration - works out of the box
- Shared caching across your entire app
- Tag-based invalidation works globally
- Perfect for single-domain applications

### Custom Global Client

Create your own client when you need app-wide configuration or mutations:

```ts
// queryClient.ts
import { createQueryClient } from '@kitbag/query'

export const { query, useQuery, defineQuery, mutate } = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000
})
```

**Use when you need:**
- Custom default settings for your app
- Mutations and advanced query patterns  
- `defineQuery` for pre-configured API layers
- Fine-tuned caching strategies

### Multiple Clients (Advanced)

Create separate clients for different contexts or APIs:

```ts
// Main app data
export const { query: appQuery, useQuery: useAppQuery } = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000
})

// Real-time data with shorter cache times
export const { query: realtimeQuery, useQuery: useRealtimeQuery } = createQueryClient({
  defaultStaleTime: 10 * 1000,
  defaultCacheTime: 30 * 1000
})
```

**Use when you have:**
- Multiple APIs with different caching needs
- Isolated data contexts that shouldn't share cache
- Different authentication or configuration requirements

## Best Practices

### 1. Start with the Default Client

Begin with the default client for simplicity:

```ts
// ✅ Best - Use the default client for most apps
import { query, useQuery } from '@kitbag/query'

export const userQuery = query('user', fetchUser)
```

### 2. Create Custom Client When Needed

Only create your own client when you need specific features:

```ts
// ✅ Good - Custom client when you need mutations or defineQuery  
export const { query, useQuery, defineQuery, mutate } = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000
})
```

### 3. Configure Sensible Defaults

When you do create a custom client, set defaults that work for most of your queries:

```ts
// ✅ Good - Sensible defaults
const { query, useQuery } = createQueryClient({
  defaultStaleTime: 2 * 60 * 1000,    // 2 minutes is often good
  defaultCacheTime: 10 * 60 * 1000,   // Keep cache for 10 minutes
  defaultRetryCount: 3                 // Retry 3 times on failure
})
```

### 4. Override Per Query When Needed

Use query-specific options for special cases:

```ts
// Real-time data - shorter stale time
const liveDataQuery = query('live-data', fetcher, {
  staleTime: 5000 // 5 seconds
})

// Static data - longer stale time
const configQuery = query('config', fetcher, {
  staleTime: 60 * 60 * 1000 // 1 hour
})
```

## Next Steps

Now that you understand the query client, learn about:

- [Queries](/core-concepts/queries) - Define your data fetching logic
- [Mutations](/core-concepts/mutations) - Handle data modifications  
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Manage cache invalidation -->