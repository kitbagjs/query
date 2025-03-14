import { QueryTag, QueryTagKey } from "./types/tags"

export function createQueryGroupTags() {
  const tags = new Map<QueryTagKey, Set<number>>()
  const subscriptions = new Map<number, Set<QueryTag>>()

  function clear(): void {
    tags.clear()
    subscriptions.clear()
  }

  function has(tag: QueryTag): boolean {
    return tags.has(tag.key)
  }

  function getTag(tag: QueryTag): Set<number> {
    if(!tags.has(tag.key)) {
      tags.set(tag.key, new Set())
    }

    return tags.get(tag.key)!
  }

  function getSubscription(id: number): Set<QueryTag> {
    if(!subscriptions.has(id)) {
      subscriptions.set(id, new Set())
    }

    return subscriptions.get(id)!
  }

  function add(tag: QueryTag, id: number): void {
    getTag(tag).add(id)
    getSubscription(id).add(tag)
  }

  function remove(tag: QueryTag, id: number): void {
    const tagSet = getTag(tag)
    const subscriptionSet = getSubscription(id)

    tagSet.delete(id)
    subscriptionSet.delete(tag)

    if(tagSet.size === 0) {
      tags.delete(tag.key)
    }

    if(subscriptionSet.size === 0) {
      subscriptions.delete(id)
    }
  }

  function addAll(tags: QueryTag[] | undefined, id: number): void {
    if(!tags) {
      return
    }

    for(const tag of tags) {
      add(tag, id)
    }
  }

  function removeAll(tags: QueryTag[] | undefined, id: number): void {
    if(!tags) {
      return
    }

    for(const tag of tags) {
      remove(tag, id)
    }
  }

  function removeAllById(id: number): void {
    const tags = Array.from(getSubscription(id))

    removeAll(tags, id)
  }

  return {
    clear,
    has,
    addAll,
    removeAllById,
  }
}