# Tags & Invalidation

When it comes time to refresh your query, there are a few options. First, each query has an `execute()` function which will ensure your query function gets called again.

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

Often we have multiple queries to different functions that are related to each other. Ideally these queries that are otherwise unrelated could be grouped together. The group ensures an easy way to set or invalidate the cache for the whole group.

As an example, let's group some queries that all use the same external API. That way when the API version changes, we can update all the queries at once because they share the same tag.

```vue
<script lang="ts" setup>
import { tag, useQuery, refreshQueryData } from '@kitbag/query'

const usesCatsApi = tag()

const catNamesQuery = useQuery(randomCatNames, () => [...], { tags: [usesCatsApi] })
const catYearsQuery = useQuery(convertToCatYears, () => [...], { tags: [usesCatsApi] })
const catYearsQuery = useQuery(checkCatIsNapping, () => [...], { tags: [usesCatsApi] })

// later
refreshQueryData(usesCatsApi)
</script>
```

Think of `tag` as a function that generates a unique identifier that helps Kitbag Query to find the query later. Since each tag generated is unique, we recommend creating and exporting your tags from a shared location.

## Tag Type

Kitbag Query also supports typed tags. Where a generic type can be added to a tag for extra type safety. By default the tag type is `unknown`. This satisfies any query, but assigning your actual type not only validates the query type but also provides improved type safety later when accessing cached data, like in `setQueryData`.

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
