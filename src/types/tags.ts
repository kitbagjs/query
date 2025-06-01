import { TagKey } from '@/getTagKey'

export const unset = Symbol('unset')
export type Unset = typeof unset

export type QueryTag<
  TData = unknown
> = {
  /**
   * @private
   * @internal
   * This property is unused, but necessary to preserve the type for TData because unused generics are ignored by typescript.
   */
  data: TData,
  key: TagKey,
}

export type QueryTagType<TQueryTag extends QueryTag> = TQueryTag extends QueryTag<infer TData>
  ? TData extends Unset
    ? unknown
    : TData
  : never

export function isQueryTag(tag: unknown): tag is QueryTag {
  return typeof tag === 'object' && tag !== null && 'data' in tag && 'key' in tag
}

export function isQueryTags(tags: unknown): tags is QueryTag[] {
  return Array.isArray(tags) && tags.every(isQueryTag)
}

export type QueryTagCallback<
  TInput = unknown
> = (input: TInput) => any

export type QueryTagFactory<
  TData = unknown,
  TInput = unknown
> = (value: TInput) => QueryTag<TData>
