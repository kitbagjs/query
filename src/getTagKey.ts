/**
 * TagKey is a unique identifier for a query tag.
 * It is the combination of the tag id, and the tag value.
 * `${tagId}-${tagValue}`
 */
export type TagKey = `${number}-${string}`

export function getTagKey(id: number, value: unknown): TagKey {
  return `${id}-${JSON.stringify(value)}`
}
