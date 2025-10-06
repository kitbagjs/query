# @kitbag/query

A type-safe, composable query system designed specifically for Vue.js applications. Built for Vue 3's Composition API with intelligent caching, tag-based invalidation, and full TypeScript support.

[![NPM Version][npm-badge]][npm-url]
[![Netlify Status][netlify-badge]][netlify-url]
[![Discord chat][discord-badge]][discord-url]
[![Open in StackBlitz][stackblitz-badge]][stackblitz-url]

<img src="https://kitbag.dev/kitbag-logo.svg" width="20%" />

## Getting Started

Get Started with our [documentation](https://kitbag-query.netlify.app/)

## Features

- **Type Safety First** - Fully typed queries, mutations, and data transformations
- **Vue 3 Native** - Built for Composition API with reactive composables
- **Intelligent Caching** - Smart caching with tag-based invalidation system
- **Error Handling** - Built-in loading states, error handling, and retry logic
- **Optimistic Updates** - Seamless mutations with automatic rollback on failure
- **Composable Architecture** - Reusable functions that feel natural in Vue

## Quick Start

### Installation

```bash
# bun
bun add @kitbag/query
# yarn
yarn add @kitbag/query
# npm
npm install @kitbag/query
```

### Creating a query

Simply pass the function (`searchCats`) and a getter for the arguments to that function (`() => ['Maine Coon']`).

```ts
import { useQuery } from '@kitbag/query'

function searchCats(breed?: string) {
  ...
}

const catsQuery = useQuery(searchCats, () => ['Maine Coon'])
```

That's it! Now you have access to several useful properties on the query for tracking loading state, error state, and of course the response from `searchCats` when it's resolved.

### Using a query

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

[npm-badge]: https://img.shields.io/npm/v/@kitbag/query.svg
[npm-url]: https://www.npmjs.org/package/@kitbag/query
[netlify-badge]: https://api.netlify.com/api/v1/badges/c12f79b8-49f9-4529-bc23-f8ffca8919a3/deploy-status
[netlify-url]: https://app.netlify.com/sites/kitbag-query/deploys
[stackblitz-badge]: https://developer.stackblitz.com/img/open_in_stackblitz_small.svg
[stackblitz-url]: https://stackblitz.com/~/github.com/kitbagjs/query-preview
[discord-badge]: https://img.shields.io/discord/1079625926024900739?logo=discord&label=Discord
[discord-url]: https://discord.gg/zw7dpcc5HV