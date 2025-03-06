export type QueryTag<
 TName extends string = string
> = {
  id: number
  name: TName,
  value: unknown,
  key: QueryTagKey
}

export type QueryTagKey = `${number}-${string}-${string}`

export type QueryTagCallback<
  TInput = unknown,
> = (input: TInput) => any

export type QueryTagFactory<
  TName extends string = string,
  TInput = unknown,
> = (value: TInput) => QueryTag<TName>

