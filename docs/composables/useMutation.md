# useMutation

The `useMutation` composable handles data modifications like creating, updating, or deleting resources. Unlike queries, mutations are not cached and must be triggered manually.

## Basic Usage

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="name" placeholder="User name" />
    <input v-model="email" placeholder="Email" />
    
    <button 
      type="submit" 
      :disabled="createUser.executing"
    >
      {{ createUser.executing ? 'Creating...' : 'Create User' }}
    </button>
    
    <div v-if="createUser.error" class="error">
      Error: {{ createUser.error.message }}
    </div>
    
    <div v-if="createUser.data" class="success">
      User created: {{ createUser.data.name }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@kitbag/query'
import { createUserMutation } from '@/mutations/users'

const name = ref('')
const email = ref('')

const createUser = useMutation(createUserMutation)

async function handleSubmit() {
  try {
    await createUser.mutate({ name: name.value, email: email.value })
    name.value = ''
    email.value = ''
  } catch (error) {
    // Error is already available in createUser.error
    console.error('Failed to create user:', error)
  }
}
</script>
```

## Return Value

`useMutation` returns a reactive object with the following properties:

### State Properties

```ts
interface MutationResult<TData, TVariables> {
  // Data returned from the mutation
  data: Ref<TData | undefined>
  
  // Whether the mutation is currently executing
  executing: Ref<boolean>
  
  // Whether the mutation has been executed at least once
  executed: Ref<boolean>
  
  // Error if the mutation failed
  error: Ref<unknown>
  
  // Whether the mutation has errored
  errored: Ref<boolean>
  
  // Function to execute the mutation
  mutate: (...args: TVariables) => Promise<TData>
}
```

### Usage Example

```vue
<script setup lang="ts">
const updateUser = useMutation(updateUserMutation)

// Access reactive properties
console.log(updateUser.data.value)      // Result data
console.log(updateUser.executing.value) // Loading state
console.log(updateUser.error.value)     // Error state

// Execute the mutation
await updateUser.mutate(userId, userData)
</script>
```

## Configuration Options

### Basic Options

```ts
const createUser = useMutation(createUserMutation, {
  // Placeholder data while executing
  placeholder: { id: 0, name: 'Creating...', email: '' }
})
```

### Callback Options

```ts
const createUser = useMutation(createUserMutation, {
  // Called when mutation starts
  onExecute: ({ payload }) => {
    console.log('Creating user with data:', payload[0])
  },
  
  // Called when mutation succeeds
  onSuccess: ({ data, payload }) => {
    console.log('User created:', data)
    showSuccessToast('User created successfully!')
  },
  
  // Called when mutation fails
  onError: ({ error, payload }) => {
    console.error('Failed to create user:', error)
    showErrorToast('Failed to create user')
  }
})
```

### Retry Options

```ts
const createUser = useMutation(createUserMutation, {
  // Number of retry attempts
  retry: 3,
  
  // Custom retry logic
  retry: (failureCount, error) => {
    // Only retry on network errors
    return failureCount < 3 && error.name === 'NetworkError'
  },
  
  // Retry delay function
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
})
```

## Mutation Functions

Define mutations using the `mutation` function:

```ts
// mutations/users.ts
import { mutation } from '@/queryClient'

interface CreateUserData {
  name: string
  email: string
}

export const createUserMutation = mutation(async (userData: CreateUserData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create user')
  }
  
  return response.json()
})

export const updateUserMutation = mutation(async (id: number, userData: Partial<CreateUserData>) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update user')
  }
  
  return response.json()
})

export const deleteUserMutation = mutation(async (id: number) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete user')
  }
  
  return { id }
})
```

## Error Handling

Handle mutation errors gracefully:

```vue
<template>
  <div>
    <button @click="handleDelete" :disabled="deleteUser.executing">
      Delete User
    </button>
    
    <div v-if="deleteUser.error" class="error">
      <p>{{ deleteUser.error.message }}</p>
      <button @click="handleDelete">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const deleteUser = useMutation(deleteUserMutation, {
  onError: ({ error }) => {
    // Handle specific error types
    if (error.status === 403) {
      showToast('You do not have permission to delete this user')
    } else if (error.status === 404) {
      showToast('User not found')
    } else {
      showToast('Failed to delete user')
    }
  }
})

async function handleDelete() {
  try {
    await deleteUser.mutate(userId)
    // Success - maybe navigate away or refresh data
    router.push('/users')
  } catch (error) {
    // Error is already handled by onError callback
  }
}
</script>
```

## Loading States

Show appropriate loading states during mutations:

```vue
<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <!-- Form fields -->
      
      <button 
        type="submit" 
        :disabled="createUser.executing"
        :class="{ 'loading': createUser.executing }"
      >
        <span v-if="createUser.executing">
          Creating...
        </span>
        <span v-else>
          Create User
        </span>
      </button>
    </form>
    
    <!-- Show success state -->
    <div v-if="createUser.executed && !createUser.error" class="success">
      User created successfully!
    </div>
  </div>
</template>

<style scoped>
.loading {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

## Optimistic Updates

Update the UI immediately, then revert if the mutation fails:

```vue
<script setup lang="ts">
import { useQueryClient } from '@kitbag/query'

const queryClient = useQueryClient()

const updateUser = useMutation(updateUserMutation, {
  onExecute: ({ payload }) => {
    const [userId, userData] = payload
    
    // Optimistically update the cache
    queryClient.setQueryData(userQuery, userId, (oldData) => ({
      ...oldData,
      ...userData
    }))
  },
  
  onError: ({ payload }) => {
    const [userId] = payload
    
    // Revert optimistic update on error
    queryClient.invalidateQueries(userQuery, userId)
  },
  
  onSuccess: ({ payload }) => {
    const [userId] = payload
    
    // Ensure we have the latest data from server
    queryClient.invalidateQueries(userQuery, userId)
  }
})
</script>
```

## Cache Invalidation

Invalidate related queries after successful mutations:

```ts
const createUser = useMutation(createUserMutation, {
  onSuccess: () => {
    // Invalidate users list query
    queryClient.invalidateQueries(usersQuery)
    
    // Invalidate user count query
    queryClient.invalidateQueries(userCountQuery)
  }
})

const updateUser = useMutation(updateUserMutation, {
  onSuccess: ({ data }) => {
    // Update specific user in cache
    queryClient.setQueryData(userQuery, data.id, data)
    
    // Invalidate users list to reflect changes
    queryClient.invalidateQueries(usersQuery)
  }
})

const deleteUser = useMutation(deleteUserMutation, {
  onSuccess: ({ payload }) => {
    const [userId] = payload
    
    // Remove user from cache
    queryClient.removeQueries(userQuery, userId)
    
    // Invalidate related queries
    queryClient.invalidateQueries(usersQuery)
  }
})
```

## Form Integration

Integrate mutations with form libraries:

### With VeeValidate

```vue
<template>
  <form @submit="onSubmit">
    <Field name="name" v-slot="{ field, errorMessage }">
      <input v-bind="field" placeholder="Name" />
      <span v-if="errorMessage" class="error">{{ errorMessage }}</span>
    </Field>
    
    <Field name="email" v-slot="{ field, errorMessage }">
      <input v-bind="field" placeholder="Email" />
      <span v-if="errorMessage" class="error">{{ errorMessage }}</span>
    </Field>
    
    <button type="submit" :disabled="createUser.executing">
      {{ createUser.executing ? 'Creating...' : 'Create User' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { useForm, Field } from 'vee-validate'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required()
})

const { handleSubmit } = useForm({ validationSchema: schema })

const createUser = useMutation(createUserMutation)

const onSubmit = handleSubmit(async (values) => {
  await createUser.mutate(values)
})
</script>
```

### With Vue 3 Reactivity

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  name: '',
  email: '',
  errors: {}
})

const createUser = useMutation(createUserMutation, {
  onSuccess: () => {
    // Reset form on success
    form.name = ''
    form.email = ''
    form.errors = {}
  },
  
  onError: ({ error }) => {
    // Handle validation errors
    if (error.status === 422) {
      form.errors = error.data.errors
    }
  }
})

async function handleSubmit() {
  form.errors = {}
  
  try {
    await createUser.mutate({
      name: form.name,
      email: form.email
    })
  } catch (error) {
    // Error handled by onError callback
  }
}
</script>
```

## Multiple Mutations

Handle multiple related mutations:

```vue
<script setup lang="ts">
const createUser = useMutation(createUserMutation)
const updateUser = useMutation(updateUserMutation)
const deleteUser = useMutation(deleteUserMutation)

// Check if any mutation is executing
const isAnyExecuting = computed(() => 
  createUser.executing.value || 
  updateUser.executing.value || 
  deleteUser.executing.value
)

// Check if any mutation has errored
const hasErrors = computed(() =>
  createUser.errored.value ||
  updateUser.errored.value ||
  deleteUser.errored.value
)
</script>
```

## TypeScript Support

`useMutation` provides full type safety:

```ts
interface CreateUserData {
  name: string
  email: string
}

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

const createUserMutation = mutation(
  async (data: CreateUserData): Promise<User> => {
    // ... mutation logic
  }
)

const createUser = useMutation(createUserMutation)

// TypeScript knows:
// createUser.mutate: (data: CreateUserData) => Promise<User>
// createUser.data: Ref<User | undefined>
```

## Best Practices

### 1. Handle Loading States

```ts
// ✅ Always disable buttons during execution
<button :disabled="mutation.executing">
  {{ mutation.executing ? 'Saving...' : 'Save' }}
</button>
```

### 2. Provide User Feedback

```ts
const createUser = useMutation(createUserMutation, {
  onSuccess: () => {
    showToast('User created successfully!', 'success')
  },
  onError: () => {
    showToast('Failed to create user', 'error')
  }
})
```

### 3. Invalidate Related Queries

```ts
const updateUser = useMutation(updateUserMutation, {
  onSuccess: ({ data }) => {
    // Update the specific user
    queryClient.setQueryData(userQuery, data.id, data)
    
    // Invalidate lists that might include this user
    queryClient.invalidateQueries(usersQuery)
  }
})
```

### 4. Handle Validation Errors

```ts
const createUser = useMutation(createUserMutation, {
  onError: ({ error }) => {
    if (error.status === 422) {
      // Handle validation errors
      setFormErrors(error.data.errors)
    } else {
      // Handle other errors
      showToast('An unexpected error occurred')
    }
  }
})
```

### 5. Use Optimistic Updates Carefully

```ts
// ✅ Only for operations likely to succeed
const likePost = useMutation(likePostMutation, {
  onExecute: ({ payload }) => {
    // Optimistically increment like count
    queryClient.setQueryData(postQuery, payload[0], (old) => ({
      ...old,
      likes: old.likes + 1,
      isLiked: true
    }))
  }
})
```

## Common Patterns

### Bulk Operations

```vue
<script setup lang="ts">
const bulkDelete = useMutation(bulkDeleteMutation)

const selectedItems = ref([])

async function deleteSelected() {
  try {
    await bulkDelete.mutate(selectedItems.value.map(item => item.id))
    selectedItems.value = []
  } catch (error) {
    console.error('Bulk delete failed:', error)
  }
}
</script>
```

### File Upload

```vue
<script setup lang="ts">
const uploadFile = useMutation(uploadFileMutation, {
  onExecute: () => {
    uploadProgress.value = 0
  }
})

async function handleFileUpload(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  await uploadFile.mutate(formData)
}
</script>
```

### Sequential Mutations

```vue
<script setup lang="ts">
const createUser = useMutation(createUserMutation)
const sendWelcomeEmail = useMutation(sendWelcomeEmailMutation)

async function createUserAndSendEmail(userData) {
  try {
    const user = await createUser.mutate(userData)
    await sendWelcomeEmail.mutate(user.id)
  } catch (error) {
    console.error('Failed to create user or send email:', error)
  }
}
</script>
```

## Next Steps

- [Error Handling](/advanced-concepts/error-handling) - Advanced error scenarios
- [Optimistic Updates](/advanced-concepts/optimistic-updates) - Improving perceived performance
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Managing cache updates