# Error Handling

<!-- Effective error handling is crucial for building robust applications. Kitbag query provides multiple layers of error handling for both queries and mutations.

## Basic Error Handling

### Query Errors

```vue
<template>
  <div>
    <div v-if="user.executing">Loading...</div>
    <div v-else-if="user.error" class="error">
      <h3>Failed to load user</h3>
      <p>{{ user.error.message }}</p>
      <button @click="user.execute()">Retry</button>
    </div>
    <div v-else-if="user.data">
      // User data
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, {
  params: [userId],
  onError: (error) => {
    console.error('User query failed:', error)
  }
})
</script>
```

### Mutation Errors

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="userData.name" />
    <input v-model="userData.email" />
    
    <button type="submit" :disabled="createUser.executing">
      Create User
    </button>
    
    <div v-if="createUser.error" class="error">
      {{ createUser.error.message }}
    </div>
  </form>
</template>

<script setup lang="ts">
const createUser = useMutation(createUserMutation, {
  onError: ({ error, payload }) => {
    console.error('Failed to create user:', error)
    showErrorToast('Failed to create user')
  }
})
</script>
```

## Error Types

### Network Errors

Handle network connectivity issues:

```ts
const userQuery = query('user', async (id: number) => {
  try {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  } catch (error) {
    // Network error
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your connection.')
    }
    
    // Timeout or other network issue
    throw new Error('Network error occurred. Please try again.')
  }
})
```

### HTTP Errors

Handle different HTTP status codes:

```ts
const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  
  if (!response.ok) {
    switch (response.status) {
      case 404:
        throw new Error('User not found')
      case 403:
        throw new Error('Access denied')
      case 500:
        throw new Error('Server error. Please try again later.')
      default:
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }
  
  return response.json()
})
```

### Validation Errors

Handle validation errors from the API:

```ts
const createUserMutation = mutation(async (userData: CreateUserData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    
    if (response.status === 422) {
      // Validation error
      const error = new Error('Validation failed')
      error.status = 422
      error.data = errorData
      throw error
    }
    
    throw new Error(errorData.message || 'Failed to create user')
  }
  
  return response.json()
})
```

## Error Boundaries

### Global Error Handling

Set up global error handling for all queries and mutations:

```ts
// queryClient.ts
import { createQueryClient } from '@kitbag/query'

export const { query, useQuery, mutation, useMutation } = createQueryClient({
  defaultQueryOptions: {
    onError: (error) => {
      // Log all query errors
      console.error('Query error:', error)
      
      // Handle specific error types globally
      if (error.status === 401) {
        // Redirect to login
        router.push('/login')
      } else if (error.status >= 500) {
        // Show generic server error message
        showToast('Server error. Please try again later.', 'error')
      }
    }
  },
  
  defaultMutationOptions: {
    onError: ({ error }) => {
      console.error('Mutation error:', error)
      
      // Global mutation error handling
      if (error.status === 401) {
        router.push('/login')
      }
    }
  }
})
```

### Component Error Boundaries

Create reusable error boundary components:

```vue
// ErrorBoundary.vue
<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-container">
      <h2>Something went wrong</h2>
      <p>{{ errorMessage }}</p>
      <button @click="retry">Try Again</button>
      <button @click="reset">Reset</button>
    </div>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

const retry = ref(() => {})
const reset = () => {
  hasError.value = false
  errorMessage.value = ''
}

// Provide error boundary functions to children
provide('errorBoundary', {
  captureError: (error: Error, retryFn?: () => void) => {
    hasError.value = true
    errorMessage.value = error.message
    retry.value = retryFn || reset
  }
})

onErrorCaptured((error) => {
  hasError.value = true
  errorMessage.value = error.message
  return false // Prevent error from propagating
})
</script>
```

Usage:

```vue
<template>
  <ErrorBoundary>
    <UserProfile :user-id="userId" />
  </ErrorBoundary>
</template>
```

## Retry Logic

### Automatic Retries

Configure automatic retries for transient errors:

```ts
const userQuery = query('user', fetchUser, {
  retry: 3, // Retry up to 3 times
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000) // Exponential backoff
})

// Custom retry logic
const importantQuery = query('important', fetchImportantData, {
  retry: (failureCount, error) => {
    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    
    // Retry up to 5 times for server errors
    return failureCount < 5
  }
})
```

### Manual Retries

Provide manual retry functionality:

```vue
<template>
  <div>
    <div v-if="user.error" class="error">
      <p>{{ user.error.message }}</p>
      <button @click="retry" :disabled="retrying">
        {{ retrying ? 'Retrying...' : 'Retry' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const retrying = ref(false)

const user = useQuery(userQuery, { params: [userId] })

async function retry() {
  retrying.value = true
  try {
    await user.execute()
  } finally {
    retrying.value = false
  }
}
</script>
```

## Error Recovery

### Fallback Data

Provide fallback data when queries fail:

```vue
<script setup lang="ts">
const user = useQuery(userQuery, {
  params: [userId],
  placeholder: {
    id: userId,
    name: 'Unknown User',
    email: 'unknown@example.com'
  },
  onError: (error) => {
    // Keep placeholder data on error
    console.warn('Using fallback user data due to error:', error)
  }
})

// Always have data available
const displayUser = computed(() => user.data.value || user.placeholder)
</script>
```

### Partial Data Recovery

Handle scenarios where some data loads successfully:

```vue
<script setup lang="ts">
const userProfile = useQuery(userProfileQuery, { params: [userId] })
const userPosts = useQuery(userPostsQuery, { params: [userId] })
const userSettings = useQuery(userSettingsQuery, { params: [userId] })

// Show what we can, even if some queries fail
const canShowProfile = computed(() => !userProfile.error)
const canShowPosts = computed(() => !userPosts.error)
const canShowSettings = computed(() => !userSettings.error)
</script>

<template>
  <div>
    <div v-if="canShowProfile">
      // User profile section
    </div>
    <div v-else class="error">
      Failed to load profile
    </div>
    
    <div v-if="canShowPosts">
      // User posts section
    </div>
    <div v-else class="error">
      Failed to load posts
    </div>
  </div>
</template>
```

## User Experience

### Error Messages

Provide user-friendly error messages:

```ts
function getErrorMessage(error: any): string {
  // Network errors
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your connection.'
  }
  
  // HTTP status codes
  switch (error.status) {
    case 400:
      return 'Invalid request. Please check your input.'
    case 401:
      return 'Please log in to continue.'
    case 403:
      return 'You do not have permission to access this resource.'
    case 404:
      return 'The requested resource was not found.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'Server error. Please try again later.'
    default:
      return error.message || 'An unexpected error occurred.'
  }
}

const user = useQuery(userQuery, {
  params: [userId],
  onError: (error) => {
    const message = getErrorMessage(error)
    showToast(message, 'error')
  }
})
```

### Loading and Error States

Provide clear feedback during error recovery:

```vue
<template>
  <div>
    // Loading state
    <div v-if="user.executing && !user.data" class="loading">
      Loading user profile...
    </div>
    
    // Error state with retry
    <div v-else-if="user.error" class="error">
      <h3>Unable to load profile</h3>
      <p>{{ getErrorMessage(user.error) }}</p>
      
      <div class="error-actions">
        <button @click="user.execute()" :disabled="user.executing">
          {{ user.executing ? 'Retrying...' : 'Try Again' }}
        </button>
        <button @click="goBack">Go Back</button>
      </div>
    </div>
    
    // Success state
    <div v-else-if="user.data">
      // Profile content
    </div>
  </div>
</template>
```

### Offline Support

Handle offline scenarios gracefully:

```vue
<script setup lang="ts">
import { useOnline } from '@vueuse/core'

const isOnline = useOnline()

const user = useQuery(userQuery, {
  params: [userId],
  enabled: isOnline, // Only execute when online
  onError: (error) => {
    if (!isOnline.value) {
      showToast('You are offline. Data will sync when connection is restored.', 'info')
    }
  }
})

// Retry when coming back online
watch(isOnline, (online) => {
  if (online && user.error.value) {
    user.execute()
  }
})
</script>

<template>
  <div>
    <div v-if="!isOnline" class="offline-banner">
      You are currently offline
    </div>
    
    // Rest of component
  </div>
</template>
```

## Error Monitoring

### Logging and Analytics

Set up error monitoring:

```ts
// errorTracking.ts
interface ErrorContext {
  userId?: string
  operation: string
  params?: any
  timestamp: Date
}

function trackError(error: Error, context: ErrorContext) {
  // Send to error tracking service
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        operation: context.operation
      },
      user: {
        id: context.userId
      },
      extra: {
        params: context.params,
        timestamp: context.timestamp
      }
    })
  }
  
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false
    })
  }
}

// Use in queries
const user = useQuery(userQuery, {
  params: [userId],
  onError: (error) => {
    trackError(error, {
      userId: currentUser.id,
      operation: 'fetchUser',
      params: [userId],
      timestamp: new Date()
    })
  }
})
```

### Error Reporting

Create an error reporting component:

```vue
// ErrorReporter.vue
<template>
  <div class="error-reporter">
    <h3>Something went wrong</h3>
    <p>{{ error.message }}</p>
    
    <details>
      <summary>Technical Details</summary>
      <pre>{{ errorDetails }}</pre>
    </details>
    
    <div class="actions">
      <button @click="retry">Try Again</button>
      <button @click="reportError">Report Issue</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: Error
  context?: any
  onRetry?: () => void
}

const props = defineProps<Props>()

const errorDetails = computed(() => ({
  message: props.error.message,
  stack: props.error.stack,
  context: props.context,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
}))

function retry() {
  props.onRetry?.()
}

function reportError() {
  // Send error report
  fetch('/api/error-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorDetails.value)
  })
  
  showToast('Error reported. Thank you!', 'success')
}
</script>
```

## Best Practices

### 1. Provide Meaningful Error Messages

```ts
// ✅ Good - User-friendly messages
const getErrorMessage = (error) => {
  if (error.status === 404) return 'User not found'
  if (error.status === 403) return 'Access denied'
  return 'Something went wrong. Please try again.'
}

// ❌ Bad - Technical error messages
const error = 'HTTP 500: Internal Server Error'
```

### 2. Handle Errors at the Right Level

```ts
// ✅ Handle specific errors locally
const user = useQuery(userQuery, {
  onError: (error) => {
    if (error.status === 404) {
      router.push('/users')
    }
  }
})

// ✅ Handle common errors globally
const queryClient = createQueryClient({
  defaultQueryOptions: {
    onError: (error) => {
      if (error.status === 401) {
        logout()
      }
    }
  }
})
```

### 3. Provide Recovery Options

```vue
// ✅ Always provide a way to recover
<div v-if="error" class="error">
  <p>{{ error.message }}</p>
  <button @click="retry">Try Again</button>
  <button @click="goBack">Go Back</button>
</div>
```

### 4. Use Appropriate Retry Logic

```ts
// ✅ Retry transient errors only
const query = query('data', fetcher, {
  retry: (count, error) => {
    // Don't retry client errors
    if (error.status >= 400 && error.status < 500) {
      return false
    }
    // Retry server errors up to 3 times
    return count < 3
  }
})
```

### 5. Monitor and Track Errors

```ts
// ✅ Track errors for monitoring
const user = useQuery(userQuery, {
  onError: (error) => {
    trackError(error, { operation: 'fetchUser', userId })
  }
})
```

## Next Steps

- [Loading States](/advanced-concepts/loading-states) - Managing loading UX
- [Background Updates](/advanced-concepts/background-updates) - Handling background data refresh
- [Optimistic Updates](/advanced-concepts/optimistic-updates) - Improving perceived performance -->