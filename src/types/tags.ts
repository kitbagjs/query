import { TagKey } from '@/getTagKey'

export const unset = Symbol('unset')
export type Unset = typeof unset

export type QueryTag<TData = unknown> = {
  /**
   * @private
   * @internal
   * Phantom field used purely to preserve the TData generic in the type;
   * the runtime value is always the `unset` symbol regardless of TData.
   */
  data: TData,
  /**
   * The tag's own unique key.
   */
  key: TagKey,
  /**
   * Own key plus all ancestor keys, in root-to-leaf order. A query tagged
   * with this tag is registered against every key in this list, so
   * setQueryData / invalidateQueries on any ancestor matches the query.
   */
  keys: readonly TagKey[],
  /**
   * Create a typed descendant of this tag. The descendant inherits this
   * tag's identity, so any operation against this tag also matches queries
   * tagged with the descendant. The descendant's data type must be assignable
   * to this tag's data type, so the parent acts as a supertype of all
   * descendants. An untyped root (`tag()`) places no constraint on descendants.
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  add: <TChildData extends [TData] extends [never] ? unknown : TData, const TKind extends string>(name: TKind) => QueryTag<TChildData>,
}

export type QueryTagType<TQueryTag extends QueryTag> = TQueryTag extends QueryTag<infer TData>
  ? TData
  : never

export function isQueryTag(tag: unknown): tag is QueryTag {
  return typeof tag === 'object' && tag !== null && 'data' in tag && 'key' in tag && 'keys' in tag
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
