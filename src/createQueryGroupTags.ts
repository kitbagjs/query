import { QueryTag } from './types/tags'
import { TagKey } from './getTagKey'

export function createQueryGroupTags() {
  const tags = new Map<TagKey, Set<number>>()
  const queries = new Map<number, Set<QueryTag>>()

  function clear(): void {
    tags.clear()
    queries.clear()
  }

  function has(tag: QueryTag): boolean {
    return tags.has(tag.key)
  }

  function getQueryIdsByTag(tag: QueryTag): Set<number> {
    if (!tags.has(tag.key)) {
      tags.set(tag.key, new Set())
    }

    return tags.get(tag.key)!
  }

  function getTagsByQueryId(queryId: number): Set<QueryTag> {
    if (!queries.has(queryId)) {
      queries.set(queryId, new Set())
    }

    return queries.get(queryId)!
  }

  function addTag(tag: QueryTag, queryId: number): void {
    getQueryIdsByTag(tag).add(queryId)
    getTagsByQueryId(queryId).add(tag)
  }

  function removeTag(tag: QueryTag, queryId: number): void {
    const queryTags = getQueryIdsByTag(tag)
    const tagQueries = getTagsByQueryId(queryId)

    queryTags.delete(queryId)
    tagQueries.delete(tag)

    if (queryTags.size === 0) {
      tags.delete(tag.key)
    }

    if (tagQueries.size === 0) {
      queries.delete(queryId)
    }
  }

  function addAllTags(tags: QueryTag[] | undefined, queryId: number): void {
    if (!tags) {
      return
    }

    for (const tag of tags) {
      addTag(tag, queryId)
    }
  }

  function removeAllTags(tags: QueryTag[] | undefined, queryId: number): void {
    if (!tags) {
      return
    }

    for (const tag of tags) {
      removeTag(tag, queryId)
    }
  }

  function removeAllTagsByQueryId(queryId: number): void {
    const tags = Array.from(getTagsByQueryId(queryId))

    removeAllTags(tags, queryId)
  }

  return {
    clear,
    has,
    addAllTags,
    removeAllTagsByQueryId,
  }
}
