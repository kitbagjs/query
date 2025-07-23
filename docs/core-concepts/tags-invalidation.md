# Tags & Invalidation

Tags provide a powerful way to organize and invalidate cached queries in @kitbag/query. They allow you to group related queries and efficiently update your cache when data changes.

## Creating Tags

Use the `tag` function to create query tags:

```ts
import { tag } from '@kitbag/query'

// Create tags for different data types
const userTag = tag('user')
const postTag = tag('post')
const commentTag = tag('comment')
const profileTag = tag('profile')
```

Tags should represent logical groupings of your data:

```ts
// Domain-based tags
const userTag = tag('user')
const orderTag = tag('order')
const productTag = tag('product')

// Feature-based tags
const dashboardTag = tag('dashboard')
const settingsTag = tag('settings')
const reportsTag = tag('reports')
```

## Tagging Queries

Add tags to your queries to group them logically:

```ts
const userQuery = query('user', fetchUser, {
  tags: [userTag, profileTag]
})

const userPostsQuery = query('user-posts', fetchUserPosts, {
  tags: [userTag, postTag]
})

const postCommentsQuery = query('post-comments', fetchPostComments, {
  tags: [postTag, commentTag]
})
```

## Cache Invalidation

Invalidate all queries with specific tags:

```ts
import { createQueryClient } from '@kitbag/query'

const { queryClient } = createQueryClient()

// Invalidate all user-related queries
queryClient.invalidate(userTag)

// Invalidate multiple tags at once
queryClient.invalidate([userTag, profileTag])
```

### Automatic Invalidation in Mutations

Set up automatic invalidation when mutations succeed:

```ts
const updateUserMutation = query.mutation(
  async (userData: UpdateUserData) => {
    const response = await fetch(`/api/users/${userData.id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
    return response.json()
  },
  {
    // Automatically invalidate these tags on success
    invalidateTags: [userTag, profileTag]
  }
)
```

## Tag Strategies

### Hierarchical Tags

Organize tags in a hierarchy for fine-grained control:

```ts
// General to specific
const dataTag = tag('data')
const userDataTag = tag('user-data')
const userProfileDataTag = tag('user-profile-data')

const userProfileQuery = query('user-profile', fetchUserProfile, {
  tags: [dataTag, userDataTag, userProfileDataTag]
})

// Invalidating dataTag invalidates everything
// Invalidating userDataTag invalidates all user-related data
// Invalidating userProfileDataTag invalidates only profile data
```

### Entity-Based Tags

Tag queries by the entities they involve:

```ts
const userTag = tag('user')
const postTag = tag('post')

// Queries involving users
const userQuery = query('user', fetchUser, { tags: [userTag] })
const usersListQuery = query('users-list', fetchUsers, { tags: [userTag] })

// Queries involving both users and posts
const userPostsQuery = query('user-posts', fetchUserPosts, { 
  tags: [userTag, postTag] 
})

// When a user is updated, all user-related queries are invalidated
// When a post is created, all post-related queries are invalidated
```

### Feature-Based Tags

Group queries by application features:

```ts
const dashboardTag = tag('dashboard')
const analyticsTag = tag('analytics')
const settingsTag = tag('settings')

const dashboardDataQuery = query('dashboard-data', fetchDashboardData, {
  tags: [dashboardTag]
})

const userAnalyticsQuery = query('user-analytics', fetchUserAnalytics, {
  tags: [dashboardTag, analyticsTag]
})

// Refresh entire dashboard
queryClient.invalidate(dashboardTag)
```

## Advanced Invalidation Patterns

### Conditional Invalidation

Invalidate queries based on conditions:

```ts
const updateUserMutation = query.mutation(
  async (userData: UpdateUserData) => {
    const response = await fetch(`/api/users/${userData.id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
    return response.json()
  },
  {
    onSuccess: (data, variables) => {
      // Always invalidate user data
      queryClient.invalidate(userTag)
      
      // Conditionally invalidate based on what changed
      if (variables.profilePicture) {
        queryClient.invalidate(profileTag)
      }
      
      if (variables.email) {
        queryClient.invalidate(authTag)
      }
    }
  }
)
```

### Partial Invalidation

Invalidate specific query instances:

```ts
// Invalidate user query for specific ID
queryClient.invalidate(userQuery, [userId])

// Invalidate all queries with userTag but only for specific parameters
queryClient.invalidate(userTag, (query) => {
  return query.params?.[0] === specificUserId
})
```

### Background Invalidation

Invalidate without showing loading states:

```ts
// Silently refetch data in the background
queryClient.invalidate(userTag, { refetchType: 'background' })

// Only invalidate, don't refetch
queryClient.invalidate(userTag, { refetchType: 'none' })
```

## Tag Organization Patterns

### By Domain Model

Organize tags around your domain models:

```ts
// E-commerce example
const userTag = tag('user')
const productTag = tag('product')
const orderTag = tag('order')
const cartTag = tag('cart')
const wishlistTag = tag('wishlist')

// CMS example
const pageTag = tag('page')
const postTag = tag('post')
const categoryTag = tag('category')
const authorTag = tag('author')
const mediaTag = tag('media')
```

### By Data Relationships

Tag queries based on data relationships:

```ts
const userTag = tag('user')
const userRelationsTag = tag('user-relations')

const userQuery = query('user', fetchUser, { 
  tags: [userTag] 
})

const userFriendsQuery = query('user-friends', fetchUserFriends, { 
  tags: [userTag, userRelationsTag] 
})

const userGroupsQuery = query('user-groups', fetchUserGroups, { 
  tags: [userTag, userRelationsTag] 
})

// Update user profile - only invalidate direct user data
userMutation.mutate(userData, {
  invalidateTags: [userTag]
})

// Update friend relationship - invalidate user relations
addFriendMutation.mutate(friendData, {
  invalidateTags: [userRelationsTag]
})
```

### By Access Patterns

Group by how data is accessed:

```ts
const listTag = tag('list')       // List views
const detailTag = tag('detail')   // Detail views
const searchTag = tag('search')   // Search results

const usersListQuery = query('users-list', fetchUsers, {
  tags: [userTag, listTag]
})

const userDetailQuery = query('user-detail', fetchUserDetail, {
  tags: [userTag, detailTag]
})

const userSearchQuery = query('user-search', searchUsers, {
  tags: [userTag, searchTag]
})
```

## Best Practices

### 1. Use Descriptive Tag Names

Make tag purposes clear:

```ts
// ✅ Good
const userProfileTag = tag('user-profile')
const dashboardMetricsTag = tag('dashboard-metrics')
const orderHistoryTag = tag('order-history')

// ❌ Bad
const tag1 = tag('data1')
const tag2 = tag('stuff')
const tag3 = tag('things')
```

### 2. Don't Over-Tag

Use tags strategically, not on every query:

```ts
// ✅ Good - Strategic tagging
const userQuery = query('user', fetchUser, { tags: [userTag] })
const staticConfigQuery = query('config', fetchConfig) // No tags needed

// ❌ Bad - Over-tagging
const timestampQuery = query('timestamp', () => Date.now(), { 
  tags: [timeTag, utilityTag, helperTag] // Unnecessary
})
```

### 3. Create a Tag System

Establish consistent tag naming and organization:

```ts
// tags/index.ts
export const tags = {
  // Entities
  user: tag('user'),
  post: tag('post'),
  comment: tag('comment'),
  
  // Features  
  dashboard: tag('dashboard'),
  settings: tag('settings'),
  reports: tag('reports'),
  
  // Data types
  list: tag('list'),
  detail: tag('detail'),
  search: tag('search')
}
```

### 4. Document Tag Relationships

Document how your tags relate to each other:

```ts
/**
 * Tag Relationships:
 * 
 * userTag: All user-related queries
 *   - userProfileTag: User profile data
 *   - userSettingsTag: User settings
 *   - userActivityTag: User activity/history
 * 
 * postTag: All post-related queries
 *   - postListTag: Post lists/feeds
 *   - postDetailTag: Individual post details
 *   - postMetricsTag: Post analytics
 */
```

## Performance Considerations

### Tag Granularity

Balance between too broad and too specific:

```ts
// Too broad - invalidates too much
const dataTag = tag('data') // Everything uses this

// Too specific - hard to manage
const userPage1Tag = tag('user-page-1')
const userPage2Tag = tag('user-page-2')
// ... hundreds of specific tags

// Just right - meaningful groupings
const userTag = tag('user')
const userListTag = tag('user-list')
const userProfileTag = tag('user-profile')
```

### Invalidation Frequency

Consider how often you need to invalidate:

```ts
// High-frequency updates - specific tags
const liveDataTag = tag('live-data')
const notificationsTag = tag('notifications')

// Low-frequency updates - broader tags
const configTag = tag('config')
const staticContentTag = tag('static-content')
```

## Next Steps

Learn more about cache management:

- [Caching](/core-concepts/caching) - Understanding cache behavior
- [useQuery Composable](/composables/useQuery) - Using tags with queries
- [Advanced Concepts](/advanced-concepts/error-handling) - Advanced cache strategies