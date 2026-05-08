import { createSequence } from './createSequence'
import { getTagKey, TagKey } from './getTagKey'
import { QueryTag, unset } from './types/tags'

const createTagId = createSequence()

function createTag<TData>(parentKeys: readonly TagKey[], label?: string): QueryTag<TData> {
  const id = createTagId()
  const ownKey = getTagKey(id, label)
  const keys = Object.freeze([...parentKeys, ownKey])

  const queryTag = {
    data: unset,
    key: ownKey,
    keys,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    add<TChildData extends [TData] extends [never] ? unknown : TData, const TKind extends string>(name: TKind): QueryTag<TChildData> {
      return createTag<TChildData>(keys, name)
    },
  }

  return queryTag as unknown as QueryTag<TData>
}

export function tag(): QueryTag<never>
export function tag<TData>(): QueryTag<TData>
export function tag(): QueryTag {
  return createTag([])
}
