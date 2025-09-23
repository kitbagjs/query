# Quick Start

## Installation

```bash
# bun
bun add @kitbag/query
# yarn
yarn add @kitbag/query
# npm
npm install @kitbag/query
```

## Creating a query

Simply pass the function you need called (`fetchUser`) and the arguments you want supplied to that function (`[userId]`).

```ts
import { useQuery } from '@kitbag/query'

const query = useQuery(fetchUser, [userId])
```

### Expanded example in a vue component

::: code-group

```vue [UserPage.vue]
<script setup lang="ts">
import { useQuery } from '@kitbag/query'
import { fetchUser } from '@/services/usersApi'

const { userId } = defineProps<{
  userId: number
}>()

const query = useQuery(fetchUser, [userId])
</script>
```

```ts [usersApi.ts]
// simple example, not important
export type User = {
  name: string,
  email: string,
}

export function fetchUser(id: number): Promise<User> {
  return axios.get(`users/${id}`)
}
```

:::

That's it! Now you have access to several useful properties on the query for tracking loading state, error state, and of course the response from `fetchUser` when it's resolved.

```vue
<template>
  <div v-if="query.loading">
    Loading...
  </div>
  
  <div v-else-if="query.errored">
    Error: {{ query.error }}
  </div>
  
  <div v-else-if="query.data">
    <h1>{{ query.data.name }}</h1>
    <p>{{ query.data.email }}</p>
  </div>
</template>
```

## Client

Kitbag query exports a default client, so you can import `useQuery` directly which is perfect for most use cases. More on creating your own [clients](/core-concepts/query-client) in a bit.

## Caching

Any other components that create a query for `fetchUser` with the same `id` arguments will share this cached response. Learn more about [caching](/core-concepts/caching).

## Next Steps

Now that you have a basic query working, let's keep going

- [Queries](/core-concepts/queries) - Dive deeper into query options and patterns
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Manage cache invalidation
- [Mutations](/core-concepts/mutations) - Handle data modifications
- [Query Client](/core-concepts/query-client) - Learn about configuration options