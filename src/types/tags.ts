import { TagKey } from '@/getTagKey'

export const unset = Symbol('unset')
export type Unset = typeof unset

export type QueryTagKinds = Record<string, unknown>

export type QueryTag<
  TData = unknown,
  TKinds extends QueryTagKinds = Record<never, never>
> = {
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
   * Names of the descendant kinds declared on this tag, in declaration order.
   * Empty for leaf tags. Used at runtime to dispatch object-form
   * setQueryData handlers to the correct descendant tag.
   */
  kinds: readonly string[],
} & {
  [K in keyof TKinds]: QueryTag<TKinds[K]>
}

export type QueryTagType<TQueryTag extends QueryTag> = TQueryTag extends QueryTag<infer TData>
  ? TData
  : never

export type QueryTagKindsOf<TQueryTag extends QueryTag> = TQueryTag extends QueryTag<any, infer TKinds>
  ? TKinds
  : never

export function isQueryTag(tag: unknown): tag is QueryTag {
  return typeof tag === 'object' && tag !== null && 'data' in tag && 'key' in tag && 'keys' in tag && 'kinds' in tag
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
