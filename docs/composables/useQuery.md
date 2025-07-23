# useQuery

The `useQuery` composable is the primary way to fetch and manage data in your Vue components. It provides reactive data, loading states, error handling, and automatic caching.

## Basic Usage

```vue
<template>
  <div>
    <div v-if="user.executing">Loading user...</div>
    <div v-else-if="user.error">Error: {{ user.error.message }}</div>
    <div v-else-if="user.data">
      <h1>{{ user.data.name }}</h1>
      <p>{{ user.data.email }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@kitbag/query'
import { userQuery } from '@/queries/users'

const props = defineProps<{ userId: number }>()

const user = useQuery(userQuery, { params: [props.userId] })
</script>
```

## Return Value

`useQuery` returns a reactive object with the following properties:

### State Properties

```ts
interface QueryResult<TData> {
  // Data returned from the query
  data: Ref<TData | undefined>
  
  // Whether the query is currently executing
  executing: Ref<boolean>
  
  // Whether the query has been executed at least once
  executed: Ref<boolean>
  
  // Error if the query failed
  error: Ref<unknown>
  
  // Whether the query has errored
  errored: Ref<boolean>
  
  // Function to manually execute the query
  execute: () => Promise<TData>
  
  // Function to dispose/cleanup the query
  dispose: () => void
}
```

### Usage Example

```vue
<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })

// Access reactive properties
console.log(user.data.value)      // Current data
console.log(user.executing.value) // Loading state
console.log(user.error.value)     // Error state
</script>
```

## Configuration Options

### Basic Options

```ts
const user = useQuery(userQuery, {
  // Parameters to pass to the query function
  params: [userId],
  
  // Whether to execute immediately (default: true)
  immediate: true,
  
  // Placeholder data while loading
  placeholder: { id: 0, name: 'Loading...', email: '' }
})
```

### Callback Options

```ts
const user = useQuery(userQuery, {
  params: [userId],
  
  // Called when query succeeds
  onSuccess: (data) => {
    console.log('User loaded:', data)
  },
  
  // Called when query fails
  onError: (error) => {
    console.error('Failed to load user:', error)
  },
  
  // Called when query starts executing
  onExecute: ({ payload }) => {
    console.log('Loading user with ID:', payload[0])
  }
})
```

### Cache Options

```ts
const user = useQuery(userQuery, {
  params: [userId],
  
  // How long data stays fresh (ms)
  staleTime: 5 * 60 * 1000, // 5 minutes
  
  // How long unused data stays cached (ms)
  cacheTime: 10 * 60 * 1000, // 10 minutes
})
```

### Retry Options

```ts
const user = useQuery(userQuery, {
  params: [userId],
  
  // Number of retry attempts
  retry: 3,
  
  // Custom retry logic
  retry: (failureCount, error) => {
    return failureCount < 3 && error.status !== 404
  },
  
  // Retry delay function
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
})
```

## Reactive Parameters

Parameters can be reactive and the query will automatically re-execute when they change:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const userId = ref(1)
const includeProfile = ref(false)

// Query re-executes when userId or includeProfile changes
const user = useQuery(userQuery, { 
  params: computed(() => [userId.value, includeProfile.value])
})

// Or with reactive refs directly
const user = useQuery(userQuery, { 
  params: [userId, includeProfile]
})
</script>
```

## Conditional Queries

Prevent queries from executing by setting parameters to `null`:

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ userId?: number }>()

// Only execute when userId is provided
const user = useQuery(userQuery, {
  params: computed(() => props.userId ? [props.userId] : null)
})
</script>
```

## Manual Execution

Disable automatic execution and trigger manually:

```vue
<template>
  <div>
    <button @click="loadUser" :disabled="user.executing">
      Load User
    </button>
    
    <div v-if="user.data">{{ user.data.name }}</div>
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, {
  params: [userId],
  immediate: false // Don't execute immediately
})

async function loadUser() {
  try {
    await user.execute()
    console.log('User loaded!')
  } catch (error) {
    console.error('Failed to load user:', error)
  }
}
</script>
```

## Loading States

Handle different loading scenarios:

```vue
<template>
  <div>
    <!-- Initial loading -->
    <div v-if="!user.executed && user.executing">
      Loading user for the first time...
    </div>
    
    <!-- Background refresh -->
    <div v-else-if="user.executed && user.executing">
      Refreshing user data...
    </div>
    
    <!-- Data loaded -->
    <div v-else-if="user.data">
      <h1>{{ user.data.name }}</h1>
    </div>
    
    <!-- Error state -->
    <div v-else-if="user.error">
      Error: {{ user.error.message }}
    </div>
  </div>
</template>
```

## Error Handling

Handle errors gracefully:

```vue
<template>
  <div>
    <div v-if="user.error" class="error">
      <p>Failed to load user: {{ user.error.message }}</p>
      <button @click="user.execute()">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, {
  params: [userId],
  onError: (error) => {
    // Log error for debugging
    console.error('User query failed:', error)
    
    // Could show toast notification, etc.
    showErrorToast('Failed to load user')
  }
})
</script>
```

## Placeholder Data

Provide placeholder data while loading:

```vue
<script setup lang="ts">
const user = useQuery(userQuery, {
  params: [userId],
  placeholder: {
    id: 0,
    name: 'Loading...',
    email: '',
    avatar: '/default-avatar.png'
  }
})

// user.data is never undefined - starts with placeholder
</script>
```

## Working with Lists

Handle list queries effectively:

```vue
<template>
  <div>
    <div v-if="users.executing && !users.data">
      Loading users...
    </div>
    
    <div v-else-if="users.data">
      <div v-for="user in users.data" :key="user.id">
        {{ user.name }}
      </div>
      
      <!-- Show loading indicator during refresh -->
      <div v-if="users.executing" class="refreshing">
        Updating...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
const limit = ref(10)

const users = useQuery(usersQuery, {
  params: [page, limit],
  placeholder: [] // Empty array placeholder
})
</script>
```

## Dependent Queries

Chain queries that depend on each other:

```vue
<script setup lang="ts">
// First query
const user = useQuery(userQuery, { params: [userId] })

// Second query depends on first
const userPosts = useQuery(userPostsQuery, {
  params: computed(() => 
    user.data.value ? [user.data.value.id] : null
  )
})
</script>
```

## Parallel Queries

Execute multiple independent queries:

```vue
<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })
const posts = useQuery(postsQuery, { params: [userId] })
const settings = useQuery(userSettingsQuery, { params: [userId] })

// All three execute in parallel
</script>
```

## Using with defineQuery

When using pre-configured queries from `defineQuery`:

```vue
<script setup lang="ts">
// Import the pre-configured composable
import { useUserQuery } from '@/api/users'

const props = defineProps<{ userId: number }>()

// All configuration is already applied
const user = useUserQuery([props.userId])
</script>
```

## TypeScript Support

`useQuery` provides full type safety:

```ts
interface User {
  id: number
  name: string
  email: string
}

const userQuery = query('user', async (id: number): Promise<User> => {
  // ... fetch logic
})

const user = useQuery(userQuery, { params: [123] })

// TypeScript knows:
// user.data: Ref<User | undefined>
// user.error: Ref<unknown>
// user.executing: Ref<boolean>
```

## Best Practices

### 1. Use Descriptive Variable Names

```ts
// ✅ Good
const userProfile = useQuery(userQuery, { params: [userId] })
const userPosts = useQuery(userPostsQuery, { params: [userId] })

// ❌ Bad
const query1 = useQuery(userQuery, { params: [userId] })
const query2 = useQuery(userPostsQuery, { params: [userId] })
```

### 2. Handle Loading and Error States

```vue
<template>
  <div>
    <!-- Always handle these states -->
    <div v-if="user.executing">Loading...</div>
    <div v-else-if="user.error">Error: {{ user.error.message }}</div>
    <div v-else-if="user.data">
      <!-- Your data -->
    </div>
  </div>
</template>
```

### 3. Use Placeholders for Better UX

```ts
// ✅ Provide meaningful placeholders
const user = useQuery(userQuery, {
  params: [userId],
  placeholder: {
    name: 'Loading...',
    avatar: '/default-avatar.png'
  }
})
```

### 4. Conditional Execution

```ts
// ✅ Use null to prevent execution when data isn't ready
const posts = useQuery(userPostsQuery, {
  params: computed(() => user.data.value ? [user.data.value.id] : null)
})
```

### 5. Appropriate Error Handling

```ts
const user = useQuery(userQuery, {
  params: [userId],
  onError: (error) => {
    // Log for debugging
    console.error('User query failed:', error)
    
    // Don't show technical errors to users
    showToast('Failed to load user profile')
  }
})
```

## Common Patterns

### Search with Debouncing

```vue
<script setup lang="ts">
import { debounce } from 'lodash-es'

const searchTerm = ref('')
const debouncedSearchTerm = ref('')

// Debounce search input
const updateSearch = debounce((term: string) => {
  debouncedSearchTerm.value = term
}, 300)

watch(searchTerm, updateSearch)

// Query executes when debounced term changes
const searchResults = useQuery(searchQuery, {
  params: computed(() => 
    debouncedSearchTerm.value ? [debouncedSearchTerm.value] : null
  )
})
</script>
```

### Infinite Scroll

```vue
<script setup lang="ts">
const page = ref(1)
const allUsers = ref([])

const users = useQuery(usersQuery, {
  params: [page],
  onSuccess: (data) => {
    if (page.value === 1) {
      allUsers.value = data
    } else {
      allUsers.value.push(...data)
    }
  }
})

function loadMore() {
  page.value++
}
</script>
```

### Polling/Auto-refresh

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const liveData = useQuery(liveDataQuery, {
  params: []
})

let interval: number

onMounted(() => {
  // Refresh every 30 seconds
  interval = setInterval(() => {
    liveData.execute()
  }, 30000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>
```

## Next Steps

- [useMutation](/composables/useMutation) - Handling data modifications
- [Error Handling](/advanced-concepts/error-handling) - Advanced error scenarios
- [Loading States](/advanced-concepts/loading-states) - Managing complex loading UX