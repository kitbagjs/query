import { createSequence } from './createSequence'
import { getTagKey, TagKey } from './getTagKey'
import { QueryTag, unset } from './types/tags'

const createTagId = createSequence()

function createTag<TData>(parentKeys: readonly TagKey[]): QueryTag<TData> {
  const id = createTagId()
  const ownKey = getTagKey(id, undefined)
  const keys = Object.freeze([...parentKeys, ownKey])

  const queryTag = {
    data: unset,
    key: ownKey,
    keys,
    add<TChildData extends [TData] extends [never] ? unknown : TData>(): QueryTag<TChildData> {
      return createTag<TChildData>(keys)
    },
  }

  return queryTag as unknown as QueryTag<TData>
}

export function tag(): QueryTag<never>
export function tag<TData>(): QueryTag<TData>
export function tag(): QueryTag {
  return createTag([])
}
