# Caching

@kitbag/query provides intelligent caching to minimize network requests while keeping your data fresh. Understanding how caching works will help you build more efficient applications.

## Cache Lifecycle

Every query goes through several cache states:

```
Fresh → Stale → Inactive → Garbage Collected
```

### Fresh Data
Data is considered "fresh" for the duration of `staleTime`. Fresh data won't trigger refetches.

```ts
const query = query('data', fetcher, {
  staleTime: 5 * 60 * 1000 // Fresh for 5 minutes
})
```

### Stale Data
After `staleTime` expires, data becomes "stale" but is still served from cache. Stale data triggers background refetches when accessed.

### Inactive Data
Data becomes inactive when no components are actively using it. Inactive data remains in cache for `cacheTime`.

### Garbage Collection
After `cacheTime` expires, unused data is removed from memory.

## Cache Configuration

### Stale Time

Controls how long data is considered fresh:

```ts
// Always fresh - never refetch automatically
const staticQuery = query('config', fetchConfig, {
  staleTime: Infinity
})

// Fresh for 1 minute
const userQuery = query('user', fetchUser, {
  staleTime: 60 * 1000
})

// Always stale - always refetch in background
const liveQuery = query('live-data', fetchLiveData, {
  staleTime: 0
})
```

### Cache Time

Controls how long inactive data stays in memory:

```ts
// Remove from memory after 2 minutes of no use
const temporaryQuery = query('temp', fetcher, {
  cacheTime: 2 * 60 * 1000
})

// Keep in memory for 1 hour after last use
const persistentQuery = query('persistent', fetcher, {
  cacheTime: 60 * 60 * 1000
})

// Never remove from memory
const permanentQuery = query('permanent', fetcher, {
  cacheTime: Infinity
})
```

## Cache Strategies

### Immediate Freshness

For data that changes frequently:

```ts
const liveDataQuery = query('live-data', fetchLiveData, {
  staleTime: 0,           // Always stale
  cacheTime: 30 * 1000    // Keep for 30 seconds
})
```

### Long-Term Caching

For static or rarely-changing data:

```ts
const configQuery = query('config', fetchConfig, {
  staleTime: 60 * 60 * 1000,    // Fresh for 1 hour
  cacheTime: 24 * 60 * 60 * 1000 // Keep for 24 hours
})
```

### Balanced Caching

For typical application data:

```ts
const userQuery = query('user', fetchUser, {
  staleTime: 5 * 60 * 1000,     // Fresh for 5 minutes
  cacheTime: 30 * 60 * 1000     // Keep for 30 minutes
})
```

## Cache Keys and Parameters

Queries with different parameters create separate cache entries:

```ts
const userQuery = query('user', fetchUser)

// These create separate cache entries:
useQuery(userQuery, { params: [1] })  // Cache key: ['user', 1]
useQuery(userQuery, { params: [2] })  // Cache key: ['user', 2]
useQuery(userQuery, { params: [3] })  // Cache key: ['user', 3]
```

### Complex Parameters

Objects and arrays in parameters are serialized for cache keys:

```ts
const searchQuery = query('search', fetchSearch)

// Different cache entries:
useQuery(searchQuery, { params: [{ term: 'vue', page: 1 }] })
useQuery(searchQuery, { params: [{ term: 'vue', page: 2 }] })
useQuery(searchQuery, { params: [{ term: 'react', page: 1 }] })
```

## Manual Cache Management

### Setting Cache Data

Directly set cache data:

```ts
// Set data for a specific query
queryClient.setQueryData(userQuery, [userId], userData)

// Set data with expiration
queryClient.setQueryData(userQuery, [userId], userData, {
  staleTime: 10 * 60 * 1000 // Fresh for 10 minutes
})
```

### Getting Cache Data

Retrieve data from cache:

```ts
// Get cached data (may be undefined)
const cachedUser = queryClient.getQueryData(userQuery, [userId])

// Get with fallback
const user = queryClient.getQueryData(userQuery, [userId]) ?? defaultUser
```

### Removing Cache Data

Remove specific cache entries:

```ts
// Remove specific query data
queryClient.removeQuery(userQuery, [userId])

// Remove all data for a query type
queryClient.removeQueries(userQuery)

// Remove all cache data
queryClient.clear()
```

## Background Updates

### Automatic Background Refetching

Stale queries automatically refetch in the background:

```ts
const userQuery = query('user', fetchUser, {
  staleTime: 2 * 60 * 1000 // Stale after 2 minutes
})

// First access - fetches from network
const user1 = useQuery(userQuery, { params: [1] })

// After 3 minutes - serves from cache, refetches in background
const user1Again = useQuery(userQuery, { params: [1] })
```

### Manual Background Updates

Trigger background updates manually:

```ts
// Refetch specific query in background
queryClient.refetchQueries(userQuery, [userId])

// Refetch all queries with a tag
queryClient.refetchQueries(userTag)

// Force refetch (ignore stale time)
queryClient.refetchQueries(userQuery, [userId], { 
  force: true 
})
```

## Cache Persistence

### Browser Storage

Persist cache across browser sessions:

```ts
const { query, useQuery } = createQueryClient({
  persistence: {
    // Use localStorage for persistence
    storage: 'local',
    
    // Persist for 24 hours
    maxAge: 24 * 60 * 60 * 1000,
    
    // Only persist specific queries
    shouldPersist: (queryKey) => {
      return queryKey[0] === 'user-preferences' || 
             queryKey[0] === 'app-config'
    }
  }
})
```

### Custom Storage

Use custom storage implementation:

```ts
const { query, useQuery } = createQueryClient({
  persistence: {
    storage: {
      getItem: (key) => myStorage.get(key),
      setItem: (key, value) => myStorage.set(key, value),
      removeItem: (key) => myStorage.delete(key)
    }
  }
})
```

## Cache Optimization Patterns

### Prefetching

Load data before it's needed:

```ts
// Prefetch user data when hovering over link
const prefetchUser = (userId: number) => {
  queryClient.prefetchQuery(userQuery, [userId])
}

// In component
<router-link 
  :to="`/user/${userId}`"
  @mouseenter="prefetchUser(userId)"
>
  View Profile
</router-link>
```

### Cache Warming

Pre-populate cache with known data:

```ts
// When creating a user, add to users list cache
const createUserMutation = query.mutation(createUser, {
  onSuccess: (newUser) => {
    // Update the users list cache
    queryClient.setQueryData(usersQuery, (oldUsers) => {
      return [...(oldUsers || []), newUser]
    })
  }
})
```

### Optimistic Updates

Update cache immediately, rollback on error:

```ts
const updateUserMutation = query.mutation(updateUser, {
  onMutate: async (variables) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(userQuery, [variables.id])
    
    // Snapshot current data
    const previousUser = queryClient.getQueryData(userQuery, [variables.id])
    
    // Optimistically update
    queryClient.setQueryData(userQuery, [variables.id], {
      ...previousUser,
      ...variables
    })
    
    return { previousUser }
  },
  
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(
      userQuery, 
      [variables.id], 
      context?.previousUser
    )
  }
})
```

## Cache Debugging

### Development Tools

Enable detailed cache logging:

```ts
const { query, useQuery } = createQueryClient({
  devtools: process.env.NODE_ENV === 'development',
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error
  }
})
```

### Cache Inspection

Inspect cache state in development:

```ts
// Get all cached queries
const allQueries = queryClient.getQueriesData()

// Get cache statistics  
const cacheStats = queryClient.getCacheStats()

// Log cache state
console.table(queryClient.getQueryCache())
```

## Best Practices

### 1. Match Cache Times to Data Patterns

```ts
// Static data - long cache times
const configQuery = query('config', fetchConfig, {
  staleTime: 60 * 60 * 1000,     // 1 hour
  cacheTime: 24 * 60 * 60 * 1000  // 24 hours
})

// User data - moderate cache times
const userQuery = query('user', fetchUser, {
  staleTime: 5 * 60 * 1000,      // 5 minutes
  cacheTime: 30 * 60 * 1000      // 30 minutes
})

// Live data - short cache times
const liveQuery = query('live', fetchLive, {
  staleTime: 10 * 1000,          // 10 seconds
  cacheTime: 60 * 1000           // 1 minute
})
```

### 2. Use Global Defaults

Set sensible defaults for most queries:

```ts
const { query, useQuery } = createQueryClient({
  defaultStaleTime: 2 * 60 * 1000,    // 2 minutes
  defaultCacheTime: 10 * 60 * 1000,   // 10 minutes
  defaultRetryCount: 3
})
```

### 3. Consider Memory Usage

Monitor cache size in production:

```ts
// Limit cache size
const { query, useQuery } = createQueryClient({
  maxQueries: 1000,  // Maximum number of cached queries
  maxCacheSize: 50 * 1024 * 1024 // 50MB cache limit
})
```

### 4. Test Cache Behavior

Test your cache configuration:

```ts
// Test stale data behavior
test('serves stale data while refetching', async () => {
  const query = createQuery('test', () => Promise.resolve('data'), {
    staleTime: 1000
  })
  
  const { result } = renderHook(() => useQuery(query))
  
  // Initial fetch
  await waitFor(() => expect(result.current.data).toBe('data'))
  
  // Wait for stale time
  await sleep(1500)
  
  // Should serve stale data immediately
  const { result: result2 } = renderHook(() => useQuery(query))
  expect(result2.current.data).toBe('data')
  expect(result2.current.isStale).toBe(true)
})
```

## Next Steps

Learn about advanced caching strategies:

- [Background Updates](/advanced-concepts/background-updates) - Advanced update patterns
- [Optimistic Updates](/advanced-concepts/optimistic-updates) - Immediate feedback strategies
- [Loading States](/advanced-concepts/loading-states) - Managing cache and loading states