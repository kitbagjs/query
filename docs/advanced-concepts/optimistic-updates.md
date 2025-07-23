# Optimistic Updates

Optimistic updates improve perceived performance by updating the UI immediately before the server confirms the change. This makes your application feel faster and more responsive.

## Basic Optimistic Updates

### Simple Optimistic Mutation

```vue
<template>
  <div>
    <button 
      @click="handleLike" 
      :disabled="likePost.executing"
      :class="{ 'liked': post.isLiked }"
    >
      <HeartIcon :filled="post.isLiked" />
      {{ post.likes }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@kitbag/query'

const queryClient = useQueryClient()
const props = defineProps<{ postId: string }>()

const post = useQuery(postQuery, { params: [props.postId] })

const likePost = useMutation(likePostMutation, {
  onExecute: ({ payload }) => {
    const [postId] = payload
    
    // Optimistically update the UI
    queryClient.setQueryData(postQuery, postId, (oldPost) => ({
      ...oldPost,
      likes: oldPost.likes + (oldPost.isLiked ? -1 : 1),
      isLiked: !oldPost.isLiked
    }))
  },
  
  onError: ({ payload, error }) => {
    const [postId] = payload
    
    // Revert optimistic update on error
    queryClient.setQueryData(postQuery, postId, (oldPost) => ({
      ...oldPost,
      likes: oldPost.likes + (oldPost.isLiked ? -1 : 1),
      isLiked: !oldPost.isLiked
    }))
    
    showToast('Failed to update like', 'error')
  },
  
  onSuccess: ({ data, payload }) => {
    const [postId] = payload
    
    // Update with server response (may have slight differences)
    queryClient.setQueryData(postQuery, postId, data)
  }
})

async function handleLike() {
  await likePost.mutate(props.postId)
}
</script>
```

### List Updates

Optimistically update items in lists:

```vue
<template>
  <div>
    <form @submit.prevent="handleAddTodo">
      <input v-model="newTodoText" placeholder="Add todo..." />
      <button type="submit">Add</button>
    </form>
    
    <div class="todos">
      <div 
        v-for="todo in todos.data" 
        :key="todo.id"
        :class="{ 'pending': todo.pending }"
      >
        <input 
          type="checkbox" 
          :checked="todo.completed"
          @change="toggleTodo(todo)"
        />
        <span>{{ todo.text }}</span>
        
        <button 
          @click="deleteTodo(todo)"
          :disabled="todo.pending"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const newTodoText = ref('')
const todos = useQuery(todosQuery, { params: [] })

const addTodo = useMutation(addTodoMutation, {
  onExecute: ({ payload }) => {
    const [todoData] = payload
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      ...todoData,
      pending: true // Mark as pending
    }
    
    // Add to list optimistically
    queryClient.setQueryData(todosQuery, [], (oldTodos) => [
      optimisticTodo,
      ...oldTodos
    ])
  },
  
  onSuccess: ({ data, payload }) => {
    const [todoData] = payload
    
    // Replace optimistic todo with real data
    queryClient.setQueryData(todosQuery, [], (oldTodos) =>
      oldTodos.map(todo => 
        todo.text === todoData.text && todo.pending 
          ? { ...data, pending: false }
          : todo
      )
    )
  },
  
  onError: ({ payload }) => {
    const [todoData] = payload
    
    // Remove optimistic todo on error
    queryClient.setQueryData(todosQuery, [], (oldTodos) =>
      oldTodos.filter(todo => 
        !(todo.text === todoData.text && todo.pending)
      )
    )
  }
})

const toggleTodo = useMutation(toggleTodoMutation, {
  onExecute: ({ payload }) => {
    const [todoId] = payload
    
    // Toggle completion status optimistically
    queryClient.setQueryData(todosQuery, [], (oldTodos) =>
      oldTodos.map(todo => 
        todo.id === todoId 
          ? { ...todo, completed: !todo.completed, pending: true }
          : todo
      )
    )
  },
  
  onSettled: ({ payload }) => {
    const [todoId] = payload
    
    // Remove pending state
    queryClient.setQueryData(todosQuery, [], (oldTodos) =>
      oldTodos.map(todo => 
        todo.id === todoId 
          ? { ...todo, pending: false }
          : todo
      )
    )
  }
})

async function handleAddTodo() {
  if (!newTodoText.value.trim()) return
  
  await addTodo.mutate({ text: newTodoText.value, completed: false })
  newTodoText.value = ''
}
</script>
```

## Advanced Optimistic Patterns

### Rollback on Error

Store previous state for accurate rollbacks:

```vue
<script setup lang="ts">
const updateUser = useMutation(updateUserMutation, {
  onExecute: ({ payload }) => {
    const [userId, userData] = payload
    
    // Store previous state for rollback
    const previousData = queryClient.getQueryData(userQuery, userId)
    
    // Store in mutation context for later use
    updateUser.context = { previousData, userId }
    
    // Apply optimistic update
    queryClient.setQueryData(userQuery, userId, (oldUser) => ({
      ...oldUser,
      ...userData
    }))
  },
  
  onError: ({ context }) => {
    // Rollback to previous state
    if (context?.previousData) {
      queryClient.setQueryData(
        userQuery, 
        context.userId, 
        context.previousData
      )
    }
  },
  
  onSuccess: ({ data, context }) => {
    // Update with server response
    queryClient.setQueryData(userQuery, context.userId, data)
  }
})
</script>
```

### Complex State Updates

Handle complex state changes with multiple related queries:

```vue
<script setup lang="ts">
const moveTaskToColumn = useMutation(moveTaskMutation, {
  onExecute: ({ payload }) => {
    const [taskId, fromColumnId, toColumnId, position] = payload
    
    // Store original state
    const fromColumn = queryClient.getQueryData(columnQuery, fromColumnId)
    const toColumn = queryClient.getQueryData(columnQuery, toColumnId)
    const task = fromColumn?.tasks.find(t => t.id === taskId)
    
    if (!task) return
    
    // Store for rollback
    moveTaskToColumn.context = { fromColumn, toColumn, task }
    
    // Update source column
    queryClient.setQueryData(columnQuery, fromColumnId, (oldColumn) => ({
      ...oldColumn,
      tasks: oldColumn.tasks.filter(t => t.id !== taskId)
    }))
    
    // Update destination column
    queryClient.setQueryData(columnQuery, toColumnId, (oldColumn) => {
      const newTasks = [...oldColumn.tasks]
      newTasks.splice(position, 0, { ...task, pending: true })
      return {
        ...oldColumn,
        tasks: newTasks
      }
    })
    
    // Update board summary
    queryClient.setQueryData(boardQuery, boardId, (oldBoard) => ({
      ...oldBoard,
      lastUpdated: new Date().toISOString()
    }))
  },
  
  onError: ({ context }) => {
    // Complex rollback
    if (context) {
      queryClient.setQueryData(columnQuery, fromColumnId, context.fromColumn)
      queryClient.setQueryData(columnQuery, toColumnId, context.toColumn)
      
      // Revert board changes
      queryClient.invalidateQueries(boardQuery, boardId)
    }
  },
  
  onSuccess: ({ data }) => {
    // Refresh affected queries with server data
    queryClient.invalidateQueries(columnQuery)
    queryClient.invalidateQueries(boardQuery)
  }
})
</script>
```

### Optimistic Updates with Validation

Validate optimistic updates before applying:

```vue
<script setup lang="ts">
function canApplyOptimisticUpdate(currentData, update) {
  // Don't apply if data is stale
  if (Date.now() - currentData.lastUpdated > 60000) {
    return false
  }
  
  // Don't apply if there are conflicting pending updates
  if (currentData.pendingUpdates?.length > 0) {
    return false
  }
  
  // Custom validation logic
  if (update.amount && update.amount > currentData.balance) {
    return false
  }
  
  return true
}

const updateBalance = useMutation(updateBalanceMutation, {
  onExecute: ({ payload }) => {
    const [accountId, amount] = payload
    const currentData = queryClient.getQueryData(accountQuery, accountId)
    
    if (!canApplyOptimisticUpdate(currentData, { amount })) {
      // Skip optimistic update, wait for server response
      return
    }
    
    queryClient.setQueryData(accountQuery, accountId, (oldAccount) => ({
      ...oldAccount,
      balance: oldAccount.balance + amount,
      pendingUpdates: [...(oldAccount.pendingUpdates || []), amount]
    }))
  }
})
</script>
```

## Optimistic Update Strategies

### Immediate Updates

Apply changes instantly for the best perceived performance:

```vue
<script setup lang="ts">
// Good for: Likes, favorites, simple toggles
const toggleFavorite = useMutation(toggleFavoriteMutation, {
  onExecute: ({ payload }) => {
    const [itemId] = payload
    
    // Update immediately - no delay
    queryClient.setQueryData(itemQuery, itemId, (oldItem) => ({
      ...oldItem,
      isFavorite: !oldItem.isFavorite,
      favoriteCount: oldItem.favoriteCount + (oldItem.isFavorite ? -1 : 1)
    }))
  }
})
</script>
```

### Delayed Rollback

Show success immediately, rollback only if needed:

```vue
<script setup lang="ts">
const sendMessage = useMutation(sendMessageMutation, {
  onExecute: ({ payload }) => {
    const [messageData] = payload
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      ...messageData,
      status: 'sending',
      timestamp: new Date().toISOString()
    }
    
    // Add message immediately
    queryClient.setQueryData(messagesQuery, [], (oldMessages) => [
      ...oldMessages,
      optimisticMessage
    ])
  },
  
  onSuccess: ({ data, payload }) => {
    const [messageData] = payload
    
    // Replace with real message
    queryClient.setQueryData(messagesQuery, [], (oldMessages) =>
      oldMessages.map(msg => 
        msg.text === messageData.text && msg.status === 'sending'
          ? { ...data, status: 'sent' }
          : msg
      )
    )
  },
  
  onError: ({ payload }) => {
    const [messageData] = payload
    
    // Mark as failed instead of removing
    queryClient.setQueryData(messagesQuery, [], (oldMessages) =>
      oldMessages.map(msg => 
        msg.text === messageData.text && msg.status === 'sending'
          ? { ...msg, status: 'failed' }
          : msg
      )
    )
  }
})
</script>
```

### Conditional Optimistic Updates

Only apply optimistic updates in certain conditions:

```vue
<script setup lang="ts">
const updateInventory = useMutation(updateInventoryMutation, {
  onExecute: ({ payload }) => {
    const [itemId, quantity] = payload
    const currentItem = queryClient.getQueryData(itemQuery, itemId)
    
    // Only optimistic update for small changes
    if (Math.abs(quantity) <= 5) {
      queryClient.setQueryData(itemQuery, itemId, (oldItem) => ({
        ...oldItem,
        stock: oldItem.stock + quantity,
        optimistic: true
      }))
    }
    // For large changes, wait for server confirmation
  },
  
  onSuccess: ({ data }) => {
    // Always update with server data
    queryClient.setQueryData(itemQuery, data.id, {
      ...data,
      optimistic: false
    })
  }
})
</script>
```

## Error Handling and Recovery

### Graceful Error Recovery

Handle optimistic update failures elegantly:

```vue
<template>
  <div>
    <div v-for="comment in comments.data" :key="comment.id">
      <div :class="{ 'failed': comment.status === 'failed' }">
        {{ comment.text }}
        
        <div v-if="comment.status === 'failed'" class="retry-actions">
          <span>Failed to post</span>
          <button @click="retryComment(comment)">Retry</button>
          <button @click="discardComment(comment)">Discard</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const addComment = useMutation(addCommentMutation, {
  onExecute: ({ payload }) => {
    const [commentData] = payload
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      ...commentData,
      status: 'pending',
      timestamp: new Date().toISOString()
    }
    
    queryClient.setQueryData(commentsQuery, [], (oldComments) => [
      ...oldComments,
      optimisticComment
    ])
  },
  
  onError: ({ payload }) => {
    const [commentData] = payload
    
    // Mark as failed for user action
    queryClient.setQueryData(commentsQuery, [], (oldComments) =>
      oldComments.map(comment => 
        comment.text === commentData.text && comment.status === 'pending'
          ? { ...comment, status: 'failed' }
          : comment
      )
    )
  }
})

function retryComment(comment) {
  // Reset status and retry
  queryClient.setQueryData(commentsQuery, [], (oldComments) =>
    oldComments.map(c => 
      c.id === comment.id 
        ? { ...c, status: 'pending' }
        : c
    )
  )
  
  addComment.mutate({ text: comment.text })
}

function discardComment(comment) {
  // Remove failed comment
  queryClient.setQueryData(commentsQuery, [], (oldComments) =>
    oldComments.filter(c => c.id !== comment.id)
  )
}
</script>
```

### Conflict Resolution

Handle conflicts when optimistic updates clash with server state:

```vue
<script setup lang="ts">
const updateDocument = useMutation(updateDocumentMutation, {
  onExecute: ({ payload }) => {
    const [docId, changes] = payload
    const currentDoc = queryClient.getQueryData(documentQuery, docId)
    
    // Store version for conflict detection
    updateDocument.context = { 
      version: currentDoc.version,
      originalChanges: changes 
    }
    
    // Apply optimistic changes
    queryClient.setQueryData(documentQuery, docId, (oldDoc) => ({
      ...oldDoc,
      ...changes,
      version: oldDoc.version + 1,
      lastModified: new Date().toISOString()
    }))
  },
  
  onError: ({ error, context, payload }) => {
    const [docId] = payload
    
    if (error.status === 409) { // Conflict
      // Get latest version from server
      queryClient.invalidateQueries(documentQuery, docId)
      
      // Show conflict resolution UI
      showConflictDialog({
        localChanges: context.originalChanges,
        serverVersion: error.data.latestVersion
      })
    } else {
      // Regular error - rollback
      queryClient.invalidateQueries(documentQuery, docId)
    }
  }
})
</script>
```

## UI Feedback for Optimistic Updates

### Visual Indicators

Show users when changes are pending:

```vue
<template>
  <div class="task-item">
    <div 
      :class="{ 
        'completed': task.completed,
        'pending': task.pending,
        'failed': task.status === 'failed'
      }"
    >
      <input 
        type="checkbox" 
        :checked="task.completed"
        @change="toggleTask"
        :disabled="task.pending"
      />
      
      <span class="task-text">{{ task.title }}</span>
      
      <!-- Status indicators -->
      <div class="status-indicators">
        <LoadingSpinner v-if="task.pending" size="small" />
        <CheckIcon v-else-if="task.completed" class="success" />
        <ErrorIcon v-else-if="task.status === 'failed'" class="error" />
      </div>
      
      <!-- Retry option for failed updates -->
      <button 
        v-if="task.status === 'failed'"
        @click="retryTask"
        class="retry-btn"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<style scoped>
.pending {
  opacity: 0.7;
  background: #f3f4f6;
}

.failed {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.status-indicators {
  margin-left: auto;
}
</style>
```

### Undo Functionality

Provide undo options for optimistic updates:

```vue
<template>
  <div>
    <!-- Action buttons -->
    <button @click="deleteItem">Delete Item</button>
    
    <!-- Undo toast -->
    <Teleport to="body">
      <div v-if="showUndoToast" class="undo-toast">
        <span>Item deleted</span>
        <button @click="undoDelete">Undo</button>
        <button @click="confirmDelete">✕</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
let undoTimeout: number
const showUndoToast = ref(false)
let pendingDeletion = null

const deleteItem = useMutation(deleteItemMutation, {
  onExecute: ({ payload }) => {
    const [itemId] = payload
    const itemToDelete = queryClient.getQueryData(itemQuery, itemId)
    
    // Store for undo
    pendingDeletion = { itemId, item: itemToDelete }
    
    // Remove from UI
    queryClient.setQueryData(itemsQuery, [], (oldItems) =>
      oldItems.filter(item => item.id !== itemId)
    )
    
    // Show undo option
    showUndoToast.value = true
    undoTimeout = setTimeout(() => {
      confirmDelete()
    }, 5000) // Auto-confirm after 5 seconds
  }
})

function undoDelete() {
  if (pendingDeletion) {
    // Restore item
    queryClient.setQueryData(itemsQuery, [], (oldItems) => [
      ...oldItems,
      pendingDeletion.item
    ])
    
    // Cancel the mutation
    deleteItem.abort()
    
    pendingDeletion = null
    showUndoToast.value = false
    clearTimeout(undoTimeout)
  }
}

function confirmDelete() {
  showUndoToast.value = false
  pendingDeletion = null
  clearTimeout(undoTimeout)
  // Mutation continues to server
}
</script>
```

## Best Practices

### 1. Use for User-Initiated Actions

```ts
// ✅ Good - User actions that should feel instant
const likePost = useMutation(likePostMutation, {
  onExecute: optimisticallyToggleLike
})

const addComment = useMutation(addCommentMutation, {
  onExecute: optimisticallyAddComment
})

// ❌ Avoid - Background/automatic updates
const syncData = useMutation(syncDataMutation) // No optimistic update
```

### 2. Keep Optimistic Updates Simple

```ts
// ✅ Good - Simple state changes
const toggleComplete = useMutation(toggleCompleteMutation, {
  onExecute: ({ payload }) => {
    const [taskId] = payload
    queryClient.setQueryData(taskQuery, taskId, (old) => ({
      ...old,
      completed: !old.completed
    }))
  }
})

// ❌ Complex - Avoid complex calculations in optimistic updates
const updateComplexState = useMutation(updateStateMutation, {
  onExecute: ({ payload }) => {
    // Avoid complex logic here
  }
})
```

### 3. Provide Clear Visual Feedback

```vue
<!-- ✅ Show pending state -->
<div :class="{ 'pending': item.pending }">
  {{ item.title }}
  <LoadingSpinner v-if="item.pending" size="small" />
</div>

<!-- ❌ No indication of pending state -->
<div>{{ item.title }}</div>
```

### 4. Handle Errors Gracefully

```ts
// ✅ Provide recovery options
const mutation = useMutation(mutateFn, {
  onError: ({ payload }) => {
    // Rollback optimistic update
    rollbackOptimisticUpdate(payload)
    
    // Provide retry option
    showRetryOption()
  }
})
```

### 5. Consider Network Conditions

```ts
// ✅ Adapt to network conditions
const isSlowConnection = useSlowConnection()

const updateData = useMutation(updateDataMutation, {
  onExecute: ({ payload }) => {
    // Only optimistic update on fast connections
    if (!isSlowConnection.value) {
      applyOptimisticUpdate(payload)
    }
  }
})
```

## Testing Optimistic Updates

### Simulate Network Delays

```ts
// Test helper for simulating network conditions
function simulateNetworkDelay(ms = 2000) {
  const originalFetch = window.fetch
  
  window.fetch = async (...args) => {
    await new Promise(resolve => setTimeout(resolve, ms))
    return originalFetch(...args)
  }
  
  return () => {
    window.fetch = originalFetch
  }
}

// In your tests
test('optimistic updates work correctly', async () => {
  const cleanup = simulateNetworkDelay(3000)
  
  // Test optimistic update behavior
  await userEvent.click(likeButton)
  
  // Should show optimistic state immediately
  expect(screen.getByText('1 like')).toBeInTheDocument()
  
  // Wait for server response
  await waitFor(() => {
    expect(screen.getByText('1 like')).toBeInTheDocument()
  })
  
  cleanup()
})
```

## Next Steps

- [Error Handling](/advanced-concepts/error-handling) - Handling optimistic update failures
- [Background Updates](/advanced-concepts/background-updates) - Combining with background sync
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Managing cache updates