# Loading States

Managing loading states effectively is crucial for good user experience. @kitbag/query provides granular loading state management for both queries and mutations.

## Query Loading States

### Basic Loading States

```vue
<template>
  <div>
    <!-- Initial loading -->
    <div v-if="user.executing && !user.data">
      <LoadingSpinner />
      <p>Loading user profile...</p>
    </div>
    
    <!-- Background refresh -->
    <div v-else-if="user.executing && user.data">
      <UserProfile :user="user.data" />
      <div class="refresh-indicator">Updating...</div>
    </div>
    
    <!-- Loaded -->
    <div v-else-if="user.data">
      <UserProfile :user="user.data" />
    </div>
    
    <!-- Error -->
    <div v-else-if="user.error">
      <ErrorMessage :error="user.error" />
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })
</script>
```

### Loading State Properties

```ts
interface QueryResult<TData> {
  executing: Ref<boolean>  // Currently fetching data
  executed: Ref<boolean>   // Has been executed at least once
  data: Ref<TData>         // Current data
  error: Ref<unknown>      // Current error
}
```

### Computed Loading States

Create computed properties for different loading scenarios:

```vue
<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })

// Different loading states
const isInitialLoading = computed(() => 
  user.executing.value && !user.executed.value
)

const isRefreshing = computed(() => 
  user.executing.value && user.executed.value && user.data.value
)

const isReloading = computed(() => 
  user.executing.value && user.executed.value && !user.data.value
)

const isEmpty = computed(() => 
  !user.executing.value && !user.data.value && !user.error.value
)
</script>

<template>
  <div>
    <!-- Initial load -->
    <div v-if="isInitialLoading" class="initial-loading">
      <SkeletonLoader />
    </div>
    
    <!-- Background refresh -->
    <div v-else-if="isRefreshing">
      <UserProfile :user="user.data" />
      <div class="refresh-bar">Updating...</div>
    </div>
    
    <!-- Reloading after error -->
    <div v-else-if="isReloading" class="reloading">
      <LoadingSpinner />
      <p>Retrying...</p>
    </div>
    
    <!-- Content loaded -->
    <div v-else-if="user.data">
      <UserProfile :user="user.data" />
    </div>
  </div>
</template>
```

## Mutation Loading States

### Basic Mutation Loading

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="userData.name" placeholder="Name" />
    <input v-model="userData.email" placeholder="Email" />
    
    <button 
      type="submit" 
      :disabled="createUser.executing"
      :class="{ 'loading': createUser.executing }"
    >
      <LoadingSpinner v-if="createUser.executing" size="small" />
      {{ createUser.executing ? 'Creating...' : 'Create User' }}
    </button>
    
    <!-- Success state -->
    <div v-if="createUser.data && !createUser.executing" class="success">
      User created successfully!
    </div>
    
    <!-- Error state -->
    <div v-if="createUser.error" class="error">
      {{ createUser.error.message }}
    </div>
  </form>
</template>

<script setup lang="ts">
const userData = reactive({ name: '', email: '' })
const createUser = useMutation(createUserMutation)

async function handleSubmit() {
  try {
    await createUser.mutate(userData)
    // Reset form on success
    userData.name = ''
    userData.email = ''
  } catch (error) {
    // Error is already available in createUser.error
  }
}
</script>
```

### Multiple Mutation States

Handle multiple mutations with different loading states:

```vue
<template>
  <div>
    <button 
      @click="handleCreate" 
      :disabled="isAnyLoading"
      class="btn-primary"
    >
      <LoadingSpinner v-if="createUser.executing" size="small" />
      Create
    </button>
    
    <button 
      @click="handleUpdate" 
      :disabled="isAnyLoading"
      class="btn-secondary"
    >
      <LoadingSpinner v-if="updateUser.executing" size="small" />
      Update
    </button>
    
    <button 
      @click="handleDelete" 
      :disabled="isAnyLoading"
      class="btn-danger"
    >
      <LoadingSpinner v-if="deleteUser.executing" size="small" />
      Delete
    </button>
    
    <!-- Global loading indicator -->
    <div v-if="isAnyLoading" class="global-loading">
      Processing...
    </div>
  </div>
</template>

<script setup lang="ts">
const createUser = useMutation(createUserMutation)
const updateUser = useMutation(updateUserMutation)
const deleteUser = useMutation(deleteUserMutation)

const isAnyLoading = computed(() => 
  createUser.executing.value || 
  updateUser.executing.value || 
  deleteUser.executing.value
)
</script>
```

## Loading UI Components

### Skeleton Loaders

Create skeleton loaders for better perceived performance:

```vue
<!-- SkeletonLoader.vue -->
<template>
  <div class="skeleton-loader">
    <div class="skeleton-header">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-text">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>
    <div class="skeleton-content">
      <div class="skeleton-line long"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-loader {
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-line.short { width: 60%; }
.skeleton-line.medium { width: 80%; }
.skeleton-line.long { width: 100%; }

.skeleton-avatar {
  width: 48px;
  height: 48px;
  background: #e2e8f0;
  border-radius: 50%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
```

### Loading Spinner Component

```vue
<!-- LoadingSpinner.vue -->
<template>
  <div :class="['spinner', `spinner-${size}`]">
    <div class="spinner-circle"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large'
}

withDefaults(defineProps<Props>(), {
  size: 'medium'
})
</script>

<style scoped>
.spinner {
  display: inline-block;
}

.spinner-circle {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small .spinner-circle {
  width: 16px;
  height: 16px;
}

.spinner-medium .spinner-circle {
  width: 32px;
  height: 32px;
}

.spinner-large .spinner-circle {
  width: 48px;
  height: 48px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

### Progressive Loading

Show content progressively as it loads:

```vue
<template>
  <div class="progressive-loader">
    <!-- Always show basic structure -->
    <div class="user-card">
      <div class="user-avatar">
        <img 
          v-if="user.data?.avatar" 
          :src="user.data.avatar" 
          :alt="user.data?.name"
        />
        <div v-else class="avatar-placeholder">
          {{ user.data?.name?.[0] || '?' }}
        </div>
      </div>
      
      <div class="user-info">
        <h2 v-if="user.data?.name">{{ user.data.name }}</h2>
        <div v-else class="skeleton-line short"></div>
        
        <p v-if="user.data?.email">{{ user.data.email }}</p>
        <div v-else class="skeleton-line medium"></div>
      </div>
      
      <!-- Additional data loads separately -->
      <div class="user-stats">
        <div v-if="userStats.data">
          <span>Posts: {{ userStats.data.posts }}</span>
          <span>Followers: {{ userStats.data.followers }}</span>
        </div>
        <div v-else-if="userStats.executing">
          <LoadingSpinner size="small" />
          Loading stats...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })
const userStats = useQuery(userStatsQuery, { 
  params: computed(() => user.data.value ? [user.data.value.id] : null)
})
</script>
```

## Advanced Loading Patterns

### Suspense-like Loading

Create a suspense-like component for loading states:

```vue
<!-- QuerySuspense.vue -->
<template>
  <div>
    <slot v-if="!isLoading" />
    <div v-else class="suspense-fallback">
      <slot name="fallback">
        <LoadingSpinner />
        <p>Loading...</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  queries: Array<{ executing: Ref<boolean>, data: Ref<any> }>
}

const props = defineProps<Props>()

const isLoading = computed(() => 
  props.queries.some(query => 
    query.executing.value && !query.data.value
  )
)
</script>
```

Usage:

```vue
<template>
  <QuerySuspense :queries="[user, posts, settings]">
    <template #fallback>
      <SkeletonLoader />
    </template>
    
    <!-- This renders only when all queries have data -->
    <UserDashboard 
      :user="user.data" 
      :posts="posts.data" 
      :settings="settings.data" 
    />
  </QuerySuspense>
</template>
```

### Staggered Loading

Show content in stages:

```vue
<template>
  <div class="staggered-content">
    <!-- Stage 1: Always show immediately -->
    <div class="stage-1">
      <h1>User Dashboard</h1>
    </div>
    
    <!-- Stage 2: Show when user data loads -->
    <div v-if="user.data" class="stage-2">
      <UserProfile :user="user.data" />
    </div>
    
    <!-- Stage 3: Show when additional data loads -->
    <div v-if="user.data && posts.data" class="stage-3">
      <UserPosts :posts="posts.data" />
    </div>
    
    <!-- Stage 4: Show when everything loads -->
    <div v-if="user.data && posts.data && stats.data" class="stage-4">
      <UserStats :stats="stats.data" />
    </div>
    
    <!-- Loading indicators for pending stages -->
    <div v-if="!user.data" class="loading-stage">
      <SkeletonLoader />
    </div>
    <div v-else-if="!posts.data" class="loading-stage">
      <LoadingSpinner size="small" /> Loading posts...
    </div>
    <div v-else-if="!stats.data" class="loading-stage">
      <LoadingSpinner size="small" /> Loading statistics...
    </div>
  </div>
</template>
```

### Conditional Loading States

Show different loading states based on context:

```vue
<script setup lang="ts">
const searchTerm = ref('')
const searchResults = useQuery(searchQuery, {
  params: computed(() => searchTerm.value ? [searchTerm.value] : null)
})

const loadingState = computed(() => {
  if (!searchTerm.value) return 'empty'
  if (searchResults.executing.value && !searchResults.data.value) return 'searching'
  if (searchResults.executing.value && searchResults.data.value) return 'refreshing'
  if (searchResults.data.value?.length === 0) return 'no-results'
  if (searchResults.data.value) return 'results'
  if (searchResults.error.value) return 'error'
  return 'idle'
})
</script>

<template>
  <div>
    <input v-model="searchTerm" placeholder="Search users..." />
    
    <div class="search-results">
      <!-- Empty state -->
      <div v-if="loadingState === 'empty'" class="empty-state">
        <SearchIcon />
        <p>Enter a search term to get started</p>
      </div>
      
      <!-- Searching -->
      <div v-else-if="loadingState === 'searching'" class="searching">
        <LoadingSpinner />
        <p>Searching...</p>
      </div>
      
      <!-- Refreshing results -->
      <div v-else-if="loadingState === 'refreshing'">
        <SearchResults :results="searchResults.data" />
        <div class="refresh-indicator">Updating results...</div>
      </div>
      
      <!-- No results -->
      <div v-else-if="loadingState === 'no-results'" class="no-results">
        <p>No results found for "{{ searchTerm }}"</p>
      </div>
      
      <!-- Results -->
      <div v-else-if="loadingState === 'results'">
        <SearchResults :results="searchResults.data" />
      </div>
      
      <!-- Error -->
      <div v-else-if="loadingState === 'error'" class="error">
        <p>Search failed: {{ searchResults.error.message }}</p>
      </div>
    </div>
  </div>
</template>
```

## Loading State Management

### Global Loading State

Track global loading across the app:

```ts
// composables/useGlobalLoading.ts
import { ref, computed } from 'vue'

const activeRequests = ref(new Set<string>())

export function useGlobalLoading() {
  const isLoading = computed(() => activeRequests.value.size > 0)
  
  function startLoading(id: string) {
    activeRequests.value.add(id)
  }
  
  function stopLoading(id: string) {
    activeRequests.value.delete(id)
  }
  
  return {
    isLoading,
    startLoading,
    stopLoading
  }
}

// Use in queries
const { startLoading, stopLoading } = useGlobalLoading()

const user = useQuery(userQuery, {
  params: [userId],
  onExecute: () => startLoading('user'),
  onSuccess: () => stopLoading('user'),
  onError: () => stopLoading('user')
})
```

### Loading State Persistence

Maintain loading states across route changes:

```ts
// composables/usePersistedLoading.ts
import { ref } from 'vue'

const loadingStates = ref(new Map<string, boolean>())

export function usePersistedLoading(key: string) {
  const isLoading = computed({
    get: () => loadingStates.value.get(key) || false,
    set: (value) => {
      if (value) {
        loadingStates.value.set(key, true)
      } else {
        loadingStates.value.delete(key)
      }
    }
  })
  
  return { isLoading }
}
```

## Best Practices

### 1. Show Immediate Feedback

```vue
<!-- ✅ Good - Immediate loading state -->
<button @click="handleSubmit" :disabled="loading">
  <LoadingSpinner v-if="loading" size="small" />
  {{ loading ? 'Saving...' : 'Save' }}
</button>

<!-- ❌ Bad - No loading feedback -->
<button @click="handleSubmit">Save</button>
```

### 2. Use Appropriate Loading Indicators

```vue
<!-- ✅ Skeleton for initial loads -->
<SkeletonLoader v-if="!user.data && user.executing" />

<!-- ✅ Subtle indicator for background updates -->
<div v-if="user.executing && user.data" class="refresh-indicator">
  Updating...
</div>

<!-- ✅ Spinner for explicit actions -->
<LoadingSpinner v-if="mutation.executing" />
```

### 3. Prevent Multiple Submissions

```vue
<!-- ✅ Disable buttons during loading -->
<button 
  @click="handleSubmit"
  :disabled="createUser.executing"
>
  Submit
</button>
```

### 4. Show Progress When Possible

```vue
<!-- ✅ Show upload progress -->
<div v-if="uploadFile.executing" class="upload-progress">
  <div class="progress-bar">
    <div 
      class="progress-fill" 
      :style="{ width: `${uploadProgress}%` }"
    ></div>
  </div>
  <span>{{ uploadProgress }}% uploaded</span>
</div>
```

### 5. Handle Loading State Cleanup

```vue
<script setup lang="ts">
const query = useQuery(userQuery, { params: [userId] })

// Clean up loading states on unmount
onUnmounted(() => {
  if (query.executing.value) {
    query.dispose()
  }
})
</script>
```

## Accessibility

### Loading State Announcements

```vue
<template>
  <div>
    <!-- Screen reader announcements -->
    <div 
      v-if="user.executing" 
      aria-live="polite" 
      aria-busy="true"
      class="sr-only"
    >
      Loading user profile
    </div>
    
    <div 
      v-if="user.data && !user.executing"
      aria-live="polite"
      class="sr-only"
    >
      User profile loaded
    </div>
    
    <!-- Visual loading indicator -->
    <LoadingSpinner 
      v-if="user.executing"
      aria-label="Loading user profile"
    />
    
    <!-- Content -->
    <div v-if="user.data" role="main">
      <UserProfile :user="user.data" />
    </div>
  </div>
</template>
```

### Focus Management

```vue
<script setup lang="ts">
const loadingRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

const user = useQuery(userQuery, {
  params: [userId],
  onSuccess: () => {
    // Focus content when loaded
    nextTick(() => {
      contentRef.value?.focus()
    })
  }
})

// Focus loading indicator when loading starts
watch(() => user.executing.value, (executing) => {
  if (executing) {
    nextTick(() => {
      loadingRef.value?.focus()
    })
  }
})
</script>

<template>
  <div>
    <div 
      v-if="user.executing"
      ref="loadingRef"
      tabindex="-1"
      aria-live="polite"
    >
      <LoadingSpinner /> Loading...
    </div>
    
    <div 
      v-else-if="user.data"
      ref="contentRef"
      tabindex="-1"
    >
      <UserProfile :user="user.data" />
    </div>
  </div>
</template>
```

## Next Steps

- [Background Updates](/advanced-concepts/background-updates) - Managing background data refresh
- [Error Handling](/advanced-concepts/error-handling) - Handling loading errors
- [Optimistic Updates](/advanced-concepts/optimistic-updates) - Improving perceived performance