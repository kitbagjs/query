# Queries

Queries are the foundation of data fetching in @kitbag/query. They define how to fetch data, when to cache it, and how to handle errors.

## Basic Query Definition

Create a query using the `query` function from your query client:

```ts
import { query } from '../queryClient'

const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
})
```

A query definition consists of:
- **Key**: Unique identifier for caching (`'user'`)
- **Fetcher**: Async function that returns the data
- **Options**: Optional configuration

## Query Keys

Query keys are used for caching and identification. They should be:

- **Unique**: Each different data source needs its own key
- **Descriptive**: Clear about what data they represent

```ts
// ✅ Good - Descriptive and unique
const userQuery = query('user', fetchUser)
const userPostsQuery = query('user-posts', fetchUserPosts)
const postCommentsQuery = query('post-comments', fetchPostComments)

// ❌ Bad - Too generic
const dataQuery = query('data', fetchSomething)
```

## Parameters

Queries can accept parameters that are passed to the fetcher function:

```ts
const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})

const postQuery = query('post', async (postId: string, includeComments = false) => {
  const url = `/api/posts/${postId}${includeComments ? '?include=comments' : ''}`
  const response = await fetch(url)
  return response.json()
})
```

When using the query, pass parameters through the `params` option:

```ts
// Single parameter
const user = useQuery(userQuery, { params: [123] })

// Multiple parameters
const post = useQuery(postQuery, { params: ['abc123', true] })
```

## Query Options

Customize query behavior with options:

```ts
const userQuery = query('user', fetchUser, {
  // How long data stays fresh (ms)
  staleTime: 5 * 60 * 1000,
  
  // How long unused data stays in cache (ms)
  cacheTime: 10 * 60 * 1000,
  
  // Retry configuration
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  
  // Tags for invalidation
  tags: [userTag]
})
```

### Stale Time

Controls how long data is considered "fresh":

```ts
// Data is fresh for 2 minutes
const query = query('data', fetcher, { 
  staleTime: 2 * 60 * 1000 
})

// Always refetch (stale immediately)
const liveQuery = query('live', fetcher, { 
  staleTime: 0 
})

// Fresh for 1 hour
const staticQuery = query('static', fetcher, { 
  staleTime: 60 * 60 * 1000 
})
```

### Cache Time

Controls how long unused data stays in memory:

```ts
// Remove from cache after 5 minutes of no use
const query = query('data', fetcher, { 
  cacheTime: 5 * 60 * 1000 
})
```

### Retry Options

Configure retry behavior for failed requests:

```ts
// Retry 5 times
const query = query('data', fetcher, { retry: 5 })

// Don't retry
const query = query('data', fetcher, { retry: false })

// Custom retry logic
const query = query('data', fetcher, { 
  retry: (failureCount, error) => {
    // Only retry on network errors, up to 3 times
    return error.name === 'NetworkError' && failureCount < 3
  }
})
```

## Error Handling

Queries automatically handle errors thrown by the fetcher function:

```ts
const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  
  // Throw errors for non-ok responses
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
})
```

Access errors in your component:

```vue
<template>
  <div v-if="user.error" class="error">
    Failed to load user: {{ user.error.message }}
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })
</script>
```

## Type Safety

@kitbag/query provides full type safety for your queries:

```ts
interface User {
  id: number
  name: string
  email: string
}

// TypeScript infers the return type
const userQuery = query('user', async (id: number): Promise<User> => {
  const response = await fetch(`/api/users/${id}`)
  return response.json() // TypeScript knows this should be User
})

// The composable knows the data type
const user = useQuery(userQuery, { params: [123] })
// user.data is typed as User | undefined
```

## Query Patterns

### Resource Queries

For fetching individual resources:

```ts
const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
})
```

### List Queries

For fetching collections:

```ts
const usersQuery = query('users', async (page = 1, limit = 10) => {
  const response = await fetch(`/api/users?page=${page}&limit=${limit}`)
  return response.json()
})
```

### Search Queries

For search functionality:

```ts
const searchQuery = query('search', async (term: string, filters?: SearchFilters) => {
  const params = new URLSearchParams({ q: term })
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      params.append(key, value)
    })
  }
  
  const response = await fetch(`/api/search?${params}`)
  return response.json()
})
```

## Best Practices

### 1. Use Descriptive Keys

Make your query keys clear and specific:

```ts
// ✅ Good
const userProfileQuery = query('user-profile', fetchUserProfile)
const userSettingsQuery = query('user-settings', fetchUserSettings)

// ❌ Bad
const userQuery1 = query('user1', fetchUserProfile)
const userQuery2 = query('user2', fetchUserSettings)
```

### 2. Handle Errors Gracefully

Always handle potential errors in your fetcher:

```ts
// ✅ Good
const query = query('data', async () => {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  } catch (error) {
    // Log for debugging, then re-throw
    console.error('Failed to fetch data:', error)
    throw error
  }
})
```

### 3. Use Appropriate Cache Settings

Match cache settings to your data's characteristics:

```ts
// Static data - cache for a long time
const configQuery = query('config', fetchConfig, {
  staleTime: 60 * 60 * 1000, // 1 hour
  cacheTime: 24 * 60 * 60 * 1000 // 24 hours
})

// Live data - short or no cache
const stockPriceQuery = query('stock-price', fetchStockPrice, {
  staleTime: 5000, // 5 seconds
  cacheTime: 30000 // 30 seconds
})
```

### 4. Organize Related Queries

Group related queries together:

```ts
// users/queries.ts
export const userQuery = query('user', fetchUser)
export const userPostsQuery = query('user-posts', fetchUserPosts)
export const userSettingsQuery = query('user-settings', fetchUserSettings)

// posts/queries.ts  
export const postQuery = query('post', fetchPost)
export const postCommentsQuery = query('post-comments', fetchPostComments)
```

## defineQuery: Pre-configured API Layers

`defineQuery` is a powerful feature that lets you create pre-configured query and useQuery functions with shared options. This is perfect for building reusable API layers where you want to export both the API function and a ready-to-use query.

### Basic defineQuery Usage

```ts  
import { createQueryClient } from '@kitbag/query'

const { defineQuery } = createQueryClient()

// Define a query with pre-configured options
const { query: userQuery, useQuery: useUserQuery } = defineQuery(
  async (id: number) => {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  },
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    tags: [userTag]
  }
)

// Export both the API function and the composable
export { userQuery, useUserQuery }
```

### Building Type-Safe API Layers

`defineQuery` shines when building comprehensive API layers:

```ts
// api/users.ts
import { createQueryClient, tag } from '@kitbag/query'

const { defineQuery } = createQueryClient()
const userTag = tag<User>()

// Base user fetcher
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
}

// Pre-configured query with all the settings you want
const { query: userQuery, useQuery: useUserQuery } = defineQuery(
  fetchUser,
  {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    tags: [userTag],
    retry: 3
  }
)

// Export both the raw API function AND the pre-configured query
export { 
  fetchUser,        // For imperative usage
  userQuery,        // For programmatic queries
  useUserQuery      // For components
}
```

Now consumers can use whichever approach fits their needs:

```vue
<script setup lang="ts">
// Import the pre-configured composable
import { useUserQuery } from '@/api/users'

const props = defineProps<{ userId: number }>()

// Ready to use with all the pre-configured options!
const user = useUserQuery([props.userId])
</script>
```

### Advanced defineQuery Patterns

#### API Layer with Multiple Endpoints

```ts
// api/blog.ts
import { createQueryClient, tag } from '@kitbag/query'

const { defineQuery } = createQueryClient()
const postTag = tag<Post>()
const userTag = tag<User>()

// Posts
const { query: postQuery, useQuery: usePostQuery } = defineQuery(
  async (id: string) => {
    const response = await fetch(`/api/posts/${id}`)
    return response.json()
  },
  { 
    staleTime: 10 * 60 * 1000, // Posts cache longer
    tags: [postTag] 
  }
)

// Post comments  
const { query: postCommentsQuery, useQuery: usePostCommentsQuery } = defineQuery(
  async (postId: string) => {
    const response = await fetch(`/api/posts/${postId}/comments`)
    return response.json()
  },
  { 
    staleTime: 2 * 60 * 1000, // Comments cache shorter
    tags: [postTag] // Same tag for invalidation
  }
)

export {
  postQuery,
  usePostQuery,
  postCommentsQuery, 
  usePostCommentsQuery
}
```

#### With Default Placeholders

```ts
// api/users.ts  
const { query: userQuery, useQuery: useUserQuery } = defineQuery(
  fetchUser,
  {
    staleTime: 5 * 60 * 1000,
    placeholder: { id: 0, name: 'Loading...', email: '' } // Type-safe placeholder
  }
)

// Components get the placeholder immediately
const user = useUserQuery([userId])
// user.data is never undefined - starts with placeholder
```

### When to Use defineQuery

**Perfect for:**

- **API layers** - Export both raw functions and pre-configured queries
- **Shared query configuration** - Common settings across related queries  
- **Component libraries** - Provide ready-to-use composables
- **Team consistency** - Enforce caching and retry policies

**Use regular `query` when:**

- You need different options per usage
- Simple one-off queries
- You're using the default client (which doesn't have `defineQuery`)

### defineQuery vs Regular Query

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

## Next Steps

Learn about using queries in your components:

- [useQuery Composable](/composables/useQuery) - Using queries in Vue components
- [Mutations](/core-concepts/mutations) - Handling data modifications
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Managing cache updates
