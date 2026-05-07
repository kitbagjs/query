import { createSequence } from './createSequence'
import { getTagKey } from './getTagKey'
import { QueryTagFactory, QueryTagCallback, QueryTag, Unset, unset, DEFAULT_TAG_KIND, DefaultTagKind } from './types/tags'

const createTagId = createSequence()

function createQueryTag(id: number, kind: string, value: unknown): QueryTag {
  return {
    data: unset,
    kind,
    key: getTagKey(id, value),
  } as QueryTag
}

export function tag<const TData = Unset, const TKind extends string = DefaultTagKind>(kind?: TKind): QueryTag<TData, TKind>
export function tag<const TData = Unset, TInput = unknown, const TKind extends string = DefaultTagKind>(callback: QueryTagCallback<TInput>, kind?: TKind): QueryTagFactory<TData, TInput, TKind>
export function tag(callbackOrKind?: QueryTagCallback | string, maybeKind?: string): QueryTag | QueryTagFactory {
  const id = createTagId()

  if (typeof callbackOrKind === 'function') {
    const callback = callbackOrKind
    const kind = maybeKind ?? DEFAULT_TAG_KIND

    return (value) => createQueryTag(id, kind, callback(value))
  }

  const kind = callbackOrKind ?? DEFAULT_TAG_KIND

  return createQueryTag(id, kind, undefined)
}
