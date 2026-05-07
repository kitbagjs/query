import { TagKey } from '@/getTagKey'

export const unset = Symbol('unset')
export type Unset = typeof unset

export const DEFAULT_TAG_KIND = 'default'
export type DefaultTagKind = typeof DEFAULT_TAG_KIND

export type QueryTag<
  TData = unknown,
  TKind extends string = string
> = {
  /**
   * @private
   * @internal
   * This property is unused, but necessary to preserve the type for TData because unused generics are ignored by typescript.
   */
  data: TData,
  kind: TKind,
  key: TagKey,
}

export type QueryTagType<TQueryTag extends QueryTag> = TQueryTag extends QueryTag<infer TData, any>
  ? TData extends Unset
    ? unknown
    : TData
  : never

export type QueryTagKind<TQueryTag extends QueryTag> = TQueryTag extends QueryTag<any, infer TKind>
  ? TKind
  : never

export function isQueryTag(tag: unknown): tag is QueryTag {
  return typeof tag === 'object' && tag !== null && 'data' in tag && 'kind' in tag && 'key' in tag
}

export function isQueryTags(tags: unknown): tags is QueryTag[] {
  return Array.isArray(tags) && tags.every(isQueryTag)
}

export type QueryTagCallback<
  TInput = unknown
> = (input: TInput) => any

export type QueryTagFactory<
  TData = unknown,
  TInput = unknown,
  TKind extends string = string
> = (value: TInput) => QueryTag<TData, TKind>
