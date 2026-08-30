import { createSequence } from './createSequence'
import { getTagKey, TagKey } from './getTagKey'
import { QueryTag, QueryTagKinds, unset } from './types/tags'

const createTagId = createSequence()

function createTag(parentKeys: readonly TagKey[], kindNames: readonly string[]): QueryTag {
  const id = createTagId()
  const ownKey = getTagKey(id, undefined)
  const keys = Object.freeze([...parentKeys, ownKey])

  const queryTag: Record<string, unknown> = {
    data: unset,
    key: ownKey,
    keys,
    kinds: Object.freeze([...kindNames]),
  }

  for (const kindName of kindNames) {
    queryTag[kindName] = createTag(keys, [])
  }

  return queryTag as unknown as QueryTag
}

export function tag(): QueryTag<never>
export function tag<TData>(): QueryTag<TData>
export function tag<TKinds extends QueryTagKinds>(kinds: (keyof TKinds & string)[]): QueryTag<TKinds[keyof TKinds], TKinds>
export function tag(kinds?: readonly string[]) {
  return createTag([], kinds ?? [])
}
