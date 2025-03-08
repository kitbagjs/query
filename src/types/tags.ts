export type QueryTag<
 TName extends string = string,
> = {
  name: TName,
  key: QueryTagKey
}

/**
 * QueryTagKey is a unique identifier for a query tag.
 * It is the combination of the tag id, and the tag value.
 * `${tagId}-${tagValue}`
 */
export type QueryTagKey = `${number}-${string}`

export type QueryTagCallback<
  TInput = unknown,
> = (input: TInput) => any

export type QueryTagFactory<
  TName extends string = string,
  TInput = unknown,
> = (value: TInput) => QueryTag<TName>

