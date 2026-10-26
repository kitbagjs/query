import { QueryTag } from './types/tags'
import { TagKey } from './getTagKey'

export function createQueryGroupTags() {
  const tagKeyToQueryIds = new Map<TagKey, Set<number>>()
  const queryIdToTags = new Map<number, Set<QueryTag>>()

  function clear(): void {
    tagKeyToQueryIds.clear()
    queryIdToTags.clear()
  }

  function has(tag: QueryTag): boolean {
    return tagKeyToQueryIds.has(tag.key)
  }

  function getQueryIdsForKey(key: TagKey): Set<number> {
    if (!tagKeyToQueryIds.has(key)) {
      tagKeyToQueryIds.set(key, new Set())
    }

    return tagKeyToQueryIds.get(key)!
  }

  function getTagsByQueryId(queryId: number): Set<QueryTag> {
    if (!queryIdToTags.has(queryId)) {
      queryIdToTags.set(queryId, new Set())
    }

    return queryIdToTags.get(queryId)!
  }

  function addTag(tag: QueryTag, queryId: number): void {
    for (const key of tag.keys) {
      getQueryIdsForKey(key).add(queryId)
    }

    getTagsByQueryId(queryId).add(tag)
  }

  function removeTag(tag: QueryTag, queryId: number): void {
    for (const key of tag.keys) {
      const queryIds = getQueryIdsForKey(key)
      queryIds.delete(queryId)
      if (queryIds.size === 0) {
        tagKeyToQueryIds.delete(key)
      }
    }

    const tagSet = getTagsByQueryId(queryId)
    tagSet.delete(tag)
    if (tagSet.size === 0) {
      queryIdToTags.delete(queryId)
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
