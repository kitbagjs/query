export type QueryTag<
 TName extends string = string
> = {
  id: symbol
  name: TName,
  value: unknown
}

type QueryTagCallback<
  TInput = unknown,
> = (input: TInput) => any

export type QueryTagFactory<
  TName extends string = string,
  TInput = unknown,
> = (value: TInput) => QueryTag<TName>

export function tag<const TName extends string>(name: TName): QueryTag<TName>
export function tag<const TName extends string, TInput>(name: TName, callback: QueryTagCallback<TInput>): QueryTagFactory<TName, TInput>
export function tag(name: string,callback?: QueryTagCallback): QueryTag | QueryTagFactory {
  const id = Symbol();

  if(callback) {
    return (value) => createQueryTag(id, name, callback(value))
  } 

  return createQueryTag(id, name, undefined)
}

function createQueryTag(id: symbol, name: string, value: unknown): QueryTag {
  return {
    id,
    name,
    value
  }
}