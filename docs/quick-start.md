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

Simply pass the function (`searchCats`) and a getter for the arguments to that function (`() => ['Maine Coon']`).

```ts
import { useQuery } from '@kitbag/query'

function searchCats(breed?: string) {
  ...
}

const catsQuery = useQuery(searchCats, () => ['Maine Coon'])
```

That's it! Now you have access to several useful properties on the query for tracking loading state, error state, and of course the response from `searchCats` when it's resolved.

## Using a query

```vue
<template>
  <div v-if="catsQuery.loading">
    Loading...
  </div>
  
  <div v-else-if="catsQuery.errored">
    Error: {{ catsQuery.error }}
  </div>
  
  <div v-for="cat in catsQuery.data ?? []" :key="cat.id">
    <h1>{{ cat.name }}</h1>
  </div>
</template>
```

## Client

Kitbag query exports a default client, so you can import `useQuery` directly which is perfect for most use cases. More on creating your own [clients](/core-concepts/query-client) in a bit.

## Caching

Any other components that create a query for `searchCats` with the same `breed` argument will share this cached response. Learn more about [caching](/core-concepts/caching).

## Next Steps

Now that you have a basic query working, let's keep going

- [Queries](/core-concepts/queries) - Dive deeper into query options and patterns
- [Tags & Invalidation](/core-concepts/tags-invalidation) - Manage cache invalidation
- [Mutations](/core-concepts/mutations) - Handle data modifications
- [Query Client](/core-concepts/query-client) - Learn about configuration options