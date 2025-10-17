# Tags & Invalidation

When it comes time to refresh your query, there are a few options. First, each query has an `execute()` function, which will force the query to refetch and update the reactive `data` for your query but also any other query that shares the same function and arguments.

## refreshQueryData

The `refreshQueryData` utility can also be used to invalidate queries based on action and args.

```ts
import { refreshQueryData } from '@kitbag/query'
import { searchCats } from '../services/catsApi'

function handleRefreshClick(): void {
  // invalidates all queries that call searchCats
  refreshQueryData(searchCats)

  // invalidates only queries that call searchCats with ['Himalayan']
  refreshQueryData(searchCats, () => ['Himalayan'])
}
```

## Tags

Often we have multiple queries to different functions that are related to each other. For example, any queries that use the current user token in API headers would probably want to be called again if the token changes. Ideally these queries that are otherwise unrelated could be grouped together.

Tags offer a way to not only organize related queries but also to set and invalidate a cache for queries you might not have direct access to. Think of `tag` as a function that generates a unique identifier that helps Kitbag Query to find the query later.

Since each tag generated is unique, we recommend creating and exporting your tags from a shared location.

::: code-group

```ts [tags.ts]
import { tag } from '@kitbag/query'

export const requiresUserContext = tag()
```

:::

Then from wherever queries are created the query options include `tags`, which expects an array of tags.

::: code-group

```vue [components/UserProfile.ts]
<script lang="ts" setup>
import { useQuery } from '@kitbag/query'
import { requiresUserContext } from '../tags'
import { fetchMe } from '../services/userApi'

const meQuery = useQuery(fetchMe, () => [], { tags: [requiresUserContext] })
</script>
```

```vue [components/NotificationsIndicator.ts]
<script lang="ts" setup>
import { useQuery } from '@kitbag/query'
import { requiresUserContext } from '../tags'
import { getNotifications } from '../services/notificationsApi'

const notificationsQuery = useQuery(getNotifications, () => [], { tags: [requiresUserContext] })
</script>
```

:::

Then later perhaps when the user token changes, you can access and invalidate the cache for this tag.

::: code-group

```ts [services/auth.ts]
import { refreshQueryData } from '@kitbag/query'
import { requiresUserContext } from '../tags'

function onLoginSuccessful(): void {
  // refreshes both meQuery and notificationsQuery
  refreshQueryData(requiresUserContext)
}
```

:::

## Tag Type

Kitbag Query also tracks a generic on each tag, which By default is `unknown`. This satisfies any query, but assigning your actual type not only validates the query type but also provides improved type safety later when accessing cached data, like in `setQueryData`

```ts
import { tag, setQueryData } from '@kitbag/query'

const catTag = tag<Cat>()

// data will be type `Cat`, return type for setter is expected to be `Cat` 
setQueryData(catTag, (data) => ...)
```

## Tag Factories

Tags can also be configured as factories, which offer a way to increase specificity through a callback you define. For example, if you have a bunch of instances of a component that has a query and you want to selectively invalidate cache.

::: code-group

```vue [components/CatViewer.vue]
<script lang="ts" setup>
import { useQuery } from '@kitbag/query'

const { catId } = defineProps<{
  catId: string
}>()

const query = useQuery(fetchCat, () => [catId])
</script>
```

:::

If in another part of your application you update the cat model, you could instead define a tag factory.

::: code-group

```ts [tags.ts]
import { tag } from '@kitbag/query'

export const catIdTag = tag<Cat, string>(((catId: string) => catId))
```

```vue [components/CatViewer.vue]
<script lang="ts" setup>
import { useQuery } from '@kitbag/query'
import { catIdTag } from '../tags'

const { catId } = defineProps<{
  catId: string
}>()

const query = useQuery(fetchCat, () => [catId], { 
  tags: (cat: Cat) => [catIdTag(cat.id)] 
})
</script>
```

```vue [components/CatEditForm.vue]
<script lang="ts" setup>
import { refreshQueryData } from '@kitbag/query'
import { catIdTag } from '../tags'

function save(catId: string): Promise<void> {
  ...
  refreshQueryData(catIdTag(catId))
}
</script>
```

:::
