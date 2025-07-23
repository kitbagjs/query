# Quick Start

Get up and running with @kitbag/query in just a few minutes.

## Installation

::: code-group

```bash [npm]
npm install @kitbag/query
```

```bash [yarn]
yarn add @kitbag/query
```

```bash [pnpm]
pnpm add @kitbag/query
```

```bash [bun]
bun add @kitbag/query
```

:::

## Basic Setup

### 1. Import the Default Client

The simplest way to get started is by importing the default, ready-to-use client:

```ts
// queries/users.ts
import { query, useQuery } from '@kitbag/query'

// Use the default client - perfect for most applications
export const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
})
```

> **Why use the default client?** It's perfect for most applications and comes pre-configured with sensible defaults. It provides shared caching, unified query management, and enables powerful features like tag-based invalidation across your entire app.

### Alternative: Create Your Own Client

If you need custom configuration or multiple isolated query contexts, you can create your own client:

```ts
// queryClient.ts
import { createQueryClient } from '@kitbag/query'

export const { query, useQuery } = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000 // 5 minutes
})
```

### 2. Define Your First Query

Your query is already defined above! But let's look at the pattern:

```ts
// queries/users.ts
import { query } from '@kitbag/query'

export const userQuery = query('user', async (id: number) => {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
})
```

### 3. Use the Query in a Component

Use the `useQuery` composable in your Vue component:

```vue
<template>
  <div>
    <div v-if="user.pending" class="loading">
      Loading user...
    </div>
    
    <div v-else-if="user.error" class="error">
      Error: {{ user.error.message }}
    </div>
    
    <div v-else-if="user.data" class="user">
      <h1>{{ user.data.name }}</h1>
      <p>{{ user.data.email }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@kitbag/query'
import { userQuery } from '../queries/users'

const props = defineProps<{
  userId: number
}>()

const user = useQuery(userQuery, {
  params: [props.userId]
})
</script>
```

## What Just Happened?

1. **Used the default client** that provides shared caching and query management
2. **Defined a query** with a unique key and async function  
3. **Used the query** in a component with automatic loading and error states
4. **Got full type safety** - TypeScript knows the shape of your data

## Next Steps

Now that you have a basic query working, explore these concepts:

- [Query Client](/core-concepts/query-client) - Learn about configuration options
- [Queries](/core-concepts/queries) - Dive deeper into query options and patterns
- [Mutations](/core-concepts/mutations) - Handle data modifications
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Manage cache invalidation

## Example with Mutations

Here's a quick example showing how to handle data mutations:

```ts
// queries/users.ts  
import { createQueryClient } from '@kitbag/query'

const { mutate } = createQueryClient()

export const createUserMutation = (userData: CreateUserData) => mutate(async () => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  return response.json()
}, [userData])
```

```vue
<script setup lang="ts">
import { createUserMutation } from '../queries/users'

const createUser = createUserMutation()

const handleSubmit = async (userData: CreateUserData) => {
  try {
    await createUser.mutate(userData)
    // Handle success
  } catch (error) {
    // Handle error
  }
}
</script>
```

That's it! You're now ready to build powerful, type-safe data layers with @kitbag/query.
