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

  function getSubscriptionIdsByTag(tag: QueryTag): Set<number> {
    if(!tags.has(tag.key)) {
      tags.set(tag.key, new Set())
    }

    return tags.get(tag.key)!
  }

  function getTagsBySubscriptionId(subscriptionId: number): Set<QueryTag> {
    if(!subscriptions.has(subscriptionId)) {
      subscriptions.set(subscriptionId, new Set())
    }

    return subscriptions.get(subscriptionId)!
  }

  function addTag(tag: QueryTag, subscriptionId: number): void {
    getSubscriptionIdsByTag(tag).add(subscriptionId)
    getTagsBySubscriptionId(subscriptionId).add(tag)
  }

  function removeTag(tag: QueryTag, subscriptionId: number): void {
    const tagSet = getSubscriptionIdsByTag(tag)
    const subscriptionSet = getTagsBySubscriptionId(subscriptionId)

    tagSet.delete(subscriptionId)
    subscriptionSet.delete(tag)

    if(tagSet.size === 0) {
      tags.delete(tag.key)
    }

    if(subscriptionSet.size === 0) {
      subscriptions.delete(subscriptionId)
    }
  }

  function addAllTags(tags: QueryTag[] | undefined, subscriptionId: number): void {
    if(!tags) {
      return
    }

    for(const tag of tags) {
      addTag(tag, subscriptionId)
    }
  }

  function removeAllTags(tags: QueryTag[] | undefined, subscriptionId: number): void {
    if(!tags) {
      return
    }

    for(const tag of tags) {
      removeTag(tag, subscriptionId)
    }
  }

  function removeAllTagsBySubscriptionId(subscriptionId: number): void {
    const tags = Array.from(getTagsBySubscriptionId(subscriptionId))

    removeAllTags(tags, subscriptionId)
  }

  return {
    clear,
    has,
    addAllTags,
    removeAllTagsBySubscriptionId,
  }
}