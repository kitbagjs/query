import { createIndexedCollection } from "./services/indexedCollection"
import { QueryTag } from "./types/tags"

export function createQueryGroupTags() {
  const collection = createIndexedCollection<QueryTag & { queryId: number }>([], ['key', 'queryId'])

  function clear(): void {
    collection.clear()
  }

  function has(tag: QueryTag): boolean {
    return collection.findItem('key', tag.key).length > 0
  }

  function addAllTags(tags: QueryTag[] | undefined = [], queryId: number): void {
    for(const tag of tags) {
      collection.addItem({ ...tag, queryId })
    }
  }

  function removeAllTagsByQueryId(queryId: number): void {
    collection.deleteItem('queryId', queryId)
  }

  return {
    clear,
    has,
    addAllTags,
    removeAllTagsByQueryId,
  }
}