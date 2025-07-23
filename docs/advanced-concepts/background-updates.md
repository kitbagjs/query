# Background Updates

Background updates allow your application to keep data fresh without interrupting the user experience. @kitbag/query provides several mechanisms for updating data in the background.

## Automatic Background Updates

### Stale Time Configuration

Control when queries automatically refetch in the background:

```ts
const userQuery = query('user', fetchUser, {
  // Data is fresh for 5 minutes
  staleTime: 5 * 60 * 1000,
  
  // After 5 minutes, queries will refetch in background when:
  // - Component remounts
  // - Window regains focus
  // - Network reconnects
})
```

### Cache Time vs Stale Time

```ts
const query = query('data', fetchData, {
  staleTime: 2 * 60 * 1000,  // Fresh for 2 minutes
  cacheTime: 10 * 60 * 1000, // Stay in cache for 10 minutes
})

// Timeline:
// 0-2min: Data is fresh, no background updates
// 2-10min: Data is stale, will update in background
// 10min+: Data is removed from cache
```

## Focus-Based Updates

Queries automatically refetch when the window regains focus:

```vue
<script setup lang="ts">
// This will refetch when user returns to the tab
const user = useQuery(userQuery, { 
  params: [userId],
  staleTime: 30 * 1000 // 30 seconds
})

// Disable focus refetching for specific queries
const staticData = useQuery(configQuery, {
  params: [],
  refetchOnWindowFocus: false
})
</script>
```

### Controlling Focus Behavior

```ts
// Global configuration
const { query, useQuery } = createQueryClient({
  defaultQueryOptions: {
    refetchOnWindowFocus: false, // Disable globally
    staleTime: 5 * 60 * 1000
  }
})

// Per-query override
const liveData = useQuery(liveDataQuery, {
  params: [],
  refetchOnWindowFocus: true, // Enable for this query
  staleTime: 0 // Always refetch
})
```

## Network-Based Updates

Queries refetch when network connection is restored:

```vue
<script setup lang="ts">
import { useOnline } from '@vueuse/core'

const isOnline = useOnline()

const user = useQuery(userQuery, {
  params: [userId],
  // Refetch when coming back online
  refetchOnReconnect: true
})

// Show connection status
watch(isOnline, (online) => {
  if (online) {
    showToast('Connection restored - updating data', 'info')
  } else {
    showToast('You are offline', 'warning')
  }
})
</script>

<template>
  <div>
    <div v-if="!isOnline" class="offline-banner">
      You are currently offline
    </div>
    
    <div v-if="user.executing && user.data" class="sync-indicator">
      Syncing data...
    </div>
    
    <UserProfile v-if="user.data" :user="user.data" />
  </div>
</template>
```

## Manual Background Updates

### Programmatic Refetch

Trigger background updates manually:

```vue
<template>
  <div>
    <button 
      @click="refreshData" 
      :disabled="user.executing"
      class="refresh-btn"
    >
      <RefreshIcon :class="{ 'spinning': user.executing }" />
      Refresh
    </button>
    
    <UserProfile v-if="user.data" :user="user.data" />
  </div>
</template>

<script setup lang="ts">
const user = useQuery(userQuery, { params: [userId] })

async function refreshData() {
  try {
    await user.execute()
    showToast('Data refreshed', 'success')
  } catch (error) {
    showToast('Failed to refresh data', 'error')
  }
}
</script>
```

### Query Client Methods

Use the query client to trigger updates:

```vue
<script setup lang="ts">
import { useQueryClient } from '@kitbag/query'

const queryClient = useQueryClient()

// Invalidate specific query
function invalidateUser() {
  queryClient.invalidateQueries(userQuery, userId)
}

// Invalidate multiple queries
function invalidateUserData() {
  queryClient.invalidateQueries(userQuery)
  queryClient.invalidateQueries(userPostsQuery)
  queryClient.invalidateQueries(userSettingsQuery)
}

// Refetch all stale queries
function refreshAllStale() {
  queryClient.refetchQueries({ stale: true })
}

// Refetch active queries
function refreshActive() {
  queryClient.refetchQueries({ active: true })
}
</script>
```

## Polling and Intervals

### Basic Polling

Set up automatic polling for live data:

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const liveStats = useQuery(liveStatsQuery, { params: [] })

let pollInterval: number

onMounted(() => {
  // Poll every 30 seconds
  pollInterval = setInterval(() => {
    liveStats.execute()
  }, 30000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})
</script>

<template>
  <div>
    <div class="live-indicator">
      <div class="pulse"></div>
      Live Data
    </div>
    
    <StatsDisplay v-if="liveStats.data" :stats="liveStats.data" />
  </div>
</template>
```

### Smart Polling

Only poll when the component is visible and the user is active:

```vue
<script setup lang="ts">
import { useIntersectionObserver, useIdle } from '@vueuse/core'

const containerRef = ref<HTMLElement>()
const { stop: stopObserver } = useIntersectionObserver(
  containerRef,
  ([{ isIntersecting }]) => {
    isVisible.value = isIntersecting
  }
)

const { idle } = useIdle(5 * 60 * 1000) // 5 minutes
const isVisible = ref(false)

const shouldPoll = computed(() => 
  isVisible.value && !idle.value && !document.hidden
)

const liveData = useQuery(liveDataQuery, { params: [] })

let pollInterval: number

watchEffect(() => {
  clearInterval(pollInterval)
  
  if (shouldPoll.value) {
    pollInterval = setInterval(() => {
      liveData.execute()
    }, 10000) // Poll every 10 seconds
  }
})

onUnmounted(() => {
  clearInterval(pollInterval)
  stopObserver()
})
</script>

<template>
  <div ref="containerRef">
    <div v-if="shouldPoll" class="polling-indicator">
      Updating live data...
    </div>
    
    <LiveDashboard v-if="liveData.data" :data="liveData.data" />
  </div>
</template>
```

### Conditional Polling

Poll based on data state:

```vue
<script setup lang="ts">
const jobStatus = useQuery(jobStatusQuery, { params: [jobId] })

// Poll while job is running
watchEffect(() => {
  if (jobStatus.data.value?.status === 'running') {
    const interval = setInterval(() => {
      jobStatus.execute()
    }, 2000)
    
    // Clean up when status changes
    watch(() => jobStatus.data.value?.status, (status) => {
      if (status !== 'running') {
        clearInterval(interval)
      }
    })
  }
})
</script>

<template>
  <div>
    <div v-if="jobStatus.data?.status === 'running'" class="job-running">
      <LoadingSpinner size="small" />
      Job is running... ({{ jobStatus.data.progress }}%)
    </div>
    
    <div v-else-if="jobStatus.data?.status === 'completed'" class="job-complete">
      Job completed successfully!
    </div>
  </div>
</template>
```

## WebSocket Integration

Combine background updates with real-time updates:

```vue
<script setup lang="ts">
import { useWebSocket } from '@vueuse/core'

const user = useQuery(userQuery, { params: [userId] })

// WebSocket for real-time updates
const { data: wsData, open, close } = useWebSocket(
  `ws://localhost:8080/users/${userId}`,
  {
    onMessage: (ws, event) => {
      const update = JSON.parse(event.data)
      
      if (update.type === 'user_updated') {
        // Update the cache immediately
        queryClient.setQueryData(userQuery, userId, update.data)
      }
    }
  }
)

onMounted(() => open())
onUnmounted(() => close())

// Still use background updates as fallback
const refreshUser = () => {
  user.execute()
}
</script>

<template>
  <div>
    <div class="connection-status">
      <div v-if="wsData" class="connected">🟢 Live</div>
      <div v-else class="disconnected">🔴 Offline</div>
    </div>
    
    <UserProfile v-if="user.data" :user="user.data" />
  </div>
</template>
```

## Background Update Strategies

### Optimistic Background Updates

Update the UI immediately, then sync in the background:

```vue
<script setup lang="ts">
const posts = useQuery(postsQuery, { params: [] })

// Optimistically add new post
async function addPostOptimistically(newPost) {
  // Update UI immediately
  const optimisticPost = { ...newPost, id: Date.now(), pending: true }
  
  queryClient.setQueryData(postsQuery, [], (oldPosts) => [
    optimisticPost,
    ...oldPosts
  ])
  
  try {
    // Create post on server
    const createdPost = await createPost(newPost)
    
    // Replace optimistic post with real data
    queryClient.setQueryData(postsQuery, [], (oldPosts) =>
      oldPosts.map(post => 
        post.id === optimisticPost.id ? createdPost : post
      )
    )
  } catch (error) {
    // Remove optimistic post on error
    queryClient.setQueryData(postsQuery, [], (oldPosts) =>
      oldPosts.filter(post => post.id !== optimisticPost.id)
    )
    
    showToast('Failed to create post', 'error')
  }
}
</script>
```

### Background Sync Queue

Queue mutations to sync in the background:

```ts
// composables/useBackgroundSync.ts
import { ref } from 'vue'

interface SyncItem {
  id: string
  mutation: () => Promise<any>
  retries: number
}

const syncQueue = ref<SyncItem[]>([])
const isProcessing = ref(false)

export function useBackgroundSync() {
  async function addToQueue(id: string, mutation: () => Promise<any>) {
    syncQueue.value.push({ id, mutation, retries: 0 })
    processQueue()
  }
  
  async function processQueue() {
    if (isProcessing.value || syncQueue.value.length === 0) return
    
    isProcessing.value = true
    
    while (syncQueue.value.length > 0) {
      const item = syncQueue.value[0]
      
      try {
        await item.mutation()
        syncQueue.value.shift() // Remove successful item
      } catch (error) {
        item.retries++
        
        if (item.retries >= 3) {
          syncQueue.value.shift() // Remove failed item
          console.error('Background sync failed permanently:', error)
        } else {
          // Move to end of queue for retry
          syncQueue.value.push(syncQueue.value.shift()!)
        }
      }
    }
    
    isProcessing.value = false
  }
  
  return {
    addToQueue,
    syncQueue: readonly(syncQueue),
    isProcessing: readonly(isProcessing)
  }
}
```

### Smart Background Refresh

Refresh data based on user behavior:

```vue
<script setup lang="ts">
import { useIdle, usePageLeave } from '@vueuse/core'

const { idle } = useIdle(2 * 60 * 1000) // 2 minutes
const user = useQuery(userQuery, { params: [userId] })

// Refresh when user becomes active again
watch(idle, (isIdle) => {
  if (!isIdle && user.data.value) {
    // Check if data is stale before refreshing
    const lastFetch = user.dataUpdatedAt?.value
    const now = Date.now()
    
    if (lastFetch && now - lastFetch > 60000) { // 1 minute
      user.execute()
    }
  }
})

// Refresh when user returns to page
usePageLeave(() => {
  // User left the page
}, () => {
  // User returned to page
  if (user.data.value) {
    user.execute()
  }
})
</script>
```

## Background Update UI

### Subtle Update Indicators

Show non-intrusive indicators for background updates:

```vue
<template>
  <div class="content-container">
    <!-- Subtle refresh indicator -->
    <div 
      v-if="user.executing && user.data" 
      class="refresh-indicator"
    >
      <div class="refresh-bar"></div>
    </div>
    
    <!-- Main content -->
    <UserProfile v-if="user.data" :user="user.data" />
    
    <!-- Toast notification for successful updates -->
    <Teleport to="body">
      <Toast 
        v-if="showUpdateToast"
        message="Profile updated"
        type="success"
        @close="showUpdateToast = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
let lastDataTimestamp = 0

const user = useQuery(userQuery, {
  params: [userId],
  onSuccess: (data) => {
    const currentTimestamp = Date.now()
    
    // Show toast if this is a background update
    if (lastDataTimestamp > 0 && currentTimestamp - lastDataTimestamp > 5000) {
      showUpdateToast.value = true
      setTimeout(() => {
        showUpdateToast.value = false
      }, 3000)
    }
    
    lastDataTimestamp = currentTimestamp
  }
})

const showUpdateToast = ref(false)
</script>

<style scoped>
.refresh-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.refresh-bar {
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  animation: refresh-pulse 2s ease-in-out infinite;
}

@keyframes refresh-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
```

### Update Notifications

Notify users of important background updates:

```vue
<script setup lang="ts">
const notifications = useQuery(notificationsQuery, { params: [] })

// Check for new notifications periodically
let notificationInterval: number

onMounted(() => {
  notificationInterval = setInterval(() => {
    notifications.execute()
  }, 60000) // Check every minute
})

onUnmounted(() => {
  clearInterval(notificationInterval)
})

// Show notification when new data arrives
watch(() => notifications.data.value, (newNotifications, oldNotifications) => {
  if (oldNotifications && newNotifications) {
    const newCount = newNotifications.length - oldNotifications.length
    
    if (newCount > 0) {
      showToast(
        `${newCount} new notification${newCount > 1 ? 's' : ''}`,
        'info'
      )
      
      // Update document title
      document.title = `(${newCount}) App Name`
    }
  }
})
</script>
```

## Performance Considerations

### Debounced Background Updates

Prevent excessive background updates:

```ts
import { debounce } from 'lodash-es'

const debouncedRefresh = debounce(() => {
  user.execute()
}, 1000)

// Multiple triggers will only result in one update
window.addEventListener('focus', debouncedRefresh)
window.addEventListener('online', debouncedRefresh)
```

### Batched Updates

Batch multiple background updates:

```ts
// composables/useBatchedUpdates.ts
const pendingUpdates = ref(new Set<string>())
let updateTimeout: number

export function useBatchedUpdates() {
  function scheduleUpdate(queryKey: string) {
    pendingUpdates.value.add(queryKey)
    
    clearTimeout(updateTimeout)
    updateTimeout = setTimeout(() => {
      // Execute all pending updates
      pendingUpdates.value.forEach(key => {
        queryClient.invalidateQueries(key)
      })
      
      pendingUpdates.value.clear()
    }, 100) // Batch updates within 100ms
  }
  
  return { scheduleUpdate }
}
```

## Best Practices

### 1. Use Appropriate Stale Times

```ts
// ✅ Good - Match stale time to data characteristics
const userProfile = query('user-profile', fetchUser, {
  staleTime: 10 * 60 * 1000 // User profiles don't change often
})

const livePrice = query('stock-price', fetchPrice, {
  staleTime: 1000 // Stock prices change frequently
})
```

### 2. Be Mindful of Battery and Data Usage

```ts
// ✅ Reduce polling frequency when on mobile/low battery
const isLowBattery = ref(false)

navigator.getBattery?.().then(battery => {
  isLowBattery.value = battery.level < 0.2
  battery.addEventListener('levelchange', () => {
    isLowBattery.value = battery.level < 0.2
  })
})

const pollInterval = computed(() => 
  isLowBattery.value ? 60000 : 10000
)
```

### 3. Handle Background Update Errors Gracefully

```ts
const user = useQuery(userQuery, {
  params: [userId],
  onError: (error, { isBackground }) => {
    if (isBackground) {
      // Don't show intrusive errors for background updates
      console.warn('Background update failed:', error)
    } else {
      // Show error for foreground requests
      showToast('Failed to load user', 'error')
    }
  }
})
```

### 4. Provide User Control

```vue
<template>
  <div>
    <div class="settings">
      <label>
        <input 
          v-model="enableBackgroundUpdates" 
          type="checkbox"
        />
        Enable automatic updates
      </label>
    </div>
    
    <UserProfile :user="user.data" />
  </div>
</template>

<script setup lang="ts">
const enableBackgroundUpdates = ref(true)

const user = useQuery(userQuery, {
  params: [userId],
  refetchOnWindowFocus: enableBackgroundUpdates,
  refetchOnReconnect: enableBackgroundUpdates
})
</script>
```

### 5. Monitor Background Update Performance

```ts
const user = useQuery(userQuery, {
  params: [userId],
  onSuccess: (data, { duration, isBackground }) => {
    if (isBackground) {
      // Track background update performance
      analytics.track('background_update', {
        query: 'user',
        duration,
        cached: duration < 100
      })
    }
  }
})
```

## Next Steps

- [Optimistic Updates](/advanced-concepts/optimistic-updates) - Improving perceived performance
- [Caching](/core-concepts/caching) - Understanding cache behavior
- [Error Handling](/advanced-concepts/error-handling) - Handling background update errors