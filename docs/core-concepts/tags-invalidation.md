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
  refreshQueryData(searchCats, ['Himalayan'])
}
```

## Tags

Often we have multiple queries to different functions that are related to each other. These queries could be grouped together using a tag. The tag ensures an easy way to set or invalidate the cache for the whole group.

```vue
<script lang="ts" setup>
import { tag, useQuery, refreshQueryData } from '@kitbag/query'

const catsTag = tag()

const catNamesQuery = useQuery(randomCatNames, () => [...], { tags: [catsTag] })
const catYearsQuery = useQuery(convertToCatYears, () => [...], { tags: [catsTag] })
const catNappingQuery = useQuery(checkCatIsNapping, () => [...], { tags: [catsTag] })

// later
refreshQueryData(catsTag)
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

Tags can also be configured as factories, which offer a way to increase specificity through a callback you define.

```ts
import { tag } from '@kitbag/query'

export const catIdTag = tag<Cat, string>(((catId: string) => catId))
```

Then assign tags on queries using the tags getter syntax.

```ts
const catsQuery = useQuery(getCat, () => [props.catId], { tags: (cat) => [catIdTag(cat.id)] })
```

This ensures that the tag is narrowed to only the queries for _this_ `catId`.

```ts
function save(catId: string): Promise<void> {
  ...
  refreshQueryData(catIdTag(catId))
}
```
