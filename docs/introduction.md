# Introduction

@kitbag/query is a type-safe, composable query system designed specifically for Vue.js applications. It provides a powerful yet simple way to fetch, cache, and manage server state with full TypeScript support.

## What is @kitbag/query?

@kitbag/query is a data fetching library that helps you:

- **Fetch data** with automatic loading and error states
- **Cache responses** intelligently to minimize network requests
- **Invalidate data** precisely using a tag-based system
- **Handle mutations** with built-in optimistic updates
- **Maintain type safety** throughout your entire data layer

## Why @kitbag/query?

### Built for Vue 3
Designed from the ground up for Vue's Composition API, providing reactive composables that feel natural in Vue applications.

### Type Safety First
Every query, mutation, and data transformation is fully typed, giving you confidence in your data layer and excellent IDE support.

### Intelligent Caching
Smart caching strategies with tag-based invalidation mean your app stays fast while keeping data fresh when it matters.

### Composable Architecture
Built on composable functions that can be easily combined and reused across your application.

## Core Concepts

- **Query Client**: The central hub that manages all your queries and cache
- **Queries**: Functions that fetch data from your API with caching and reactivity
- **Mutations**: Functions that modify data with built-in error handling
- **Tags**: A powerful system for organizing and invalidating cached data
- **Composables**: Vue-specific functions like `useQuery` for reactive data fetching

## Getting Started

Ready to start using @kitbag/query in your Vue application? Head over to our [Quick Start](/quick-start) guide to get up and running in minutes.