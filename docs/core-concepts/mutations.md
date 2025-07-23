# Mutations

Mutations handle data modifications in @kitbag/query. They provide a structured way to update server state while managing loading states, errors, and cache invalidation.

## Basic Mutation

Create a mutation using the query client:

```ts
import { createQueryClient } from '@kitbag/query'

const { query } = createQueryClient()

const createUserMutation = query.mutation(async (userData: CreateUserData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  
  if (!response.ok) throw new Error('Failed to create user')
  return response.json()
})
```

## Using Mutations in Components

Use mutations in your Vue components:

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" placeholder="Name" required />
    <input v-model="form.email" placeholder="Email" required />
    
    <button type="submit" :disabled="createUser.pending">
      {{ createUser.pending ? 'Creating...' : 'Create User' }}
    </button>
    
    <div v-if="createUser.error" class="error">
      {{ createUser.error.message }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createUserMutation } from '../queries/users'

const form = ref({
  name: '',
  email: ''
})

const createUser = createUserMutation()

const handleSubmit = async () => {
  try {
    const newUser = await createUser.mutate(form.value)
    console.log('User created:', newUser)
    // Reset form or redirect
    form.value = { name: '', email: '' }
  } catch (error) {
    // Error handling is automatic, but you can add custom logic here
    console.error('Failed to create user:', error)
  }
}
</script>
```

## Mutation State

Mutations provide reactive state for tracking the operation:

```ts
const createUser = createUserMutation()

// Reactive state properties:
createUser.pending    // boolean - Is the mutation running?
createUser.error      // Error | null - Any error that occurred
createUser.data       // T | undefined - The result data
createUser.mutate     // Function to trigger the mutation
createUser.reset      // Function to reset state
```

## Mutation Options

Configure mutations with options:

```ts
const updateUserMutation = query.mutation(
  async (userData: UpdateUserData) => {
    // Mutation logic
  },
  {
    // Retry failed mutations
    retry: 2,
    
    // Custom retry delay
    retryDelay: (attempt) => attempt * 1000,
    
    // Tags to invalidate on success
    invalidateTags: [userTag, profileTag],
    
    // Optimistic updates
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries(userQuery)
      
      // Snapshot current value
      const previousUser = queryClient.getQueryData(userQuery, variables.id)
      
      // Optimistically update
      queryClient.setQueryData(userQuery, variables.id, {
        ...previousUser,
        ...variables
      })
      
      return { previousUser }
    },
    
    // Rollback on error
    onError: (error, variables, context) => {
      queryClient.setQueryData(userQuery, variables.id, context?.previousUser)
    },
    
    // Always run after mutation
    onSettled: () => {
      queryClient.invalidateQueries(userQuery)
    }
  }
)
```

## Cache Invalidation

Mutations can automatically invalidate related queries:

```ts
import { userTag, profileTag } from '../tags'

const updateUserMutation = query.mutation(
  async (userData: UpdateUserData) => {
    const response = await fetch(`/api/users/${userData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  },
  {
    // Invalidate all queries with these tags
    invalidateTags: [userTag, profileTag]
  }
)
```

## Optimistic Updates

Provide instant feedback with optimistic updates:

```ts
const updateUserMutation = query.mutation(
  async (userData: UpdateUserData) => {
    // Actual API call
    const response = await fetch(`/api/users/${userData.id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
    return response.json()
  },
  {
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(userQuery)
      
      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userQuery, [variables.id])
      
      // Optimistically update to the new value
      queryClient.setQueryData(userQuery, [variables.id], {
        ...previousUser,
        ...variables
      })
      
      // Return context for potential rollback
      return { previousUser, userId: variables.id }
    },
    
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          userQuery, 
          [context.userId], 
          context.previousUser
        )
      }
    },
    
    onSettled: (data, error, variables) => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries(userQuery, [variables.id])
    }
  }
)
```

## Multiple Mutations

Handle multiple related mutations:

```ts
// Create separate mutations for different operations
const createUserMutation = query.mutation(createUserAPI)
const updateUserMutation = query.mutation(updateUserAPI)
const deleteUserMutation = query.mutation(deleteUserAPI)

// Use in component
const createUser = createUserMutation()
const updateUser = updateUserMutation()
const deleteUser = deleteUserMutation()

const handleCreate = () => createUser.mutate(userData)
const handleUpdate = () => updateUser.mutate(userData)
const handleDelete = () => deleteUser.mutate(userId)
```

## Error Handling

Handle different types of errors:

```ts
const mutation = query.mutation(
  async (data) => {
    const response = await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      // Different error types for different status codes
      if (response.status === 400) {
        const errorData = await response.json()
        throw new ValidationError(errorData.message, errorData.fields)
      } else if (response.status === 401) {
        throw new AuthError('Unauthorized')
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    }
    
    return response.json()
  }
)

// In component
const handleSubmit = async () => {
  try {
    await mutate(formData)
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      setFieldErrors(error.fields)
    } else if (error instanceof AuthError) {
      // Redirect to login
      router.push('/login')
    } else {
      // Generic error handling
      showToast('Something went wrong')
    }
  }
}
```

## Mutation Patterns

### Form Submission

```ts
const submitFormMutation = query.mutation(async (formData: FormData) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  })
  return response.json()
})

// Usage
const submitForm = submitFormMutation()

const handleSubmit = async (event: Event) => {
  const formData = new FormData(event.target as HTMLFormElement)
  await submitForm.mutate(formData)
}
```

### Batch Operations

```ts
const batchUpdateMutation = query.mutation(async (updates: BatchUpdate[]) => {
  const response = await fetch('/api/batch-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates })
  })
  return response.json()
})
```

### File Upload

```ts
const uploadFileMutation = query.mutation(
  async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    return response.json()
  },
  {
    // Don't retry file uploads
    retry: false
  }
)
```

## Best Practices

### 1. Use Descriptive Names

Make mutation purposes clear:

```ts
// ✅ Good
const createUserMutation = query.mutation(createUser)
const updateUserProfileMutation = query.mutation(updateProfile)
const deleteUserAccountMutation = query.mutation(deleteAccount)

// ❌ Bad
const userMutation1 = query.mutation(doSomething)
const mutation2 = query.mutation(doSomethingElse)
```

### 2. Handle Loading States

Always show feedback during mutations:

```vue
<template>
  <button 
    :disabled="isLoading" 
    @click="handleSave"
    :class="{ loading: isLoading }"
  >
    {{ isLoading ? 'Saving...' : 'Save Changes' }}
  </button>
</template>

<script setup lang="ts">
const saveMutation = saveMutation()
const isLoading = computed(() => saveMutation.pending)
</script>
```

### 3. Invalidate Related Data

Keep your cache fresh by invalidating related queries:

```ts
const updateUserMutation = query.mutation(updateUser, {
  invalidateTags: [userTag, profileTag, settingsTag]
})
```

### 4. Use Optimistic Updates Carefully

Only use optimistic updates when you're confident about success:

```ts
// ✅ Good - Simple field update, likely to succeed
const updateNameMutation = query.mutation(updateName, {
  onMutate: optimisticallyUpdateName
})

// ❌ Risky - Complex operation, many failure points
const complexMutation = query.mutation(complexOperation)
// Better to just show loading state
```

## Next Steps

Learn more about managing your cache:

- [Tags & Invalidation](/core-concepts/tags-invalidation) - Organize and invalidate cached data
- [Caching](/core-concepts/caching) - Understanding cache behavior
- [useMutation Composable](/composables/useMutation) - Advanced mutation usage