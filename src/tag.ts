import { createSequence } from './createSequence'
import { getTagKey } from './getTagKey'
import { QueryTagFactory, QueryTagCallback, QueryTag, Unset, unset } from './types/tags'

const createTagId = createSequence()

function createQueryTag(id: number, value: unknown): QueryTag {
  return {
    data: unset,
    key: getTagKey(id, value),
  }
}

export function tag<const TData = Unset>(): QueryTag<TData>
export function tag<const TData = Unset, TInput = unknown>(callback: QueryTagCallback<TInput>): QueryTagFactory<TData, TInput>
export function tag(callback?: QueryTagCallback): QueryTag | QueryTagFactory {
  const id = createTagId()

  if (callback) {
    return (value) => createQueryTag(id, callback(value))
  }

  return createQueryTag(id, undefined)
}
