type QueryTag<
  TName extends string = string,
  TValue = any, 
> = {
  id: Symbol
  value: TValue
  name: TName
}

type QueryTagCallback<
  TInput = unknown,
  TOutput = unknown
> = (input: TInput) => TOutput

type QueryTagFactory<
  TName extends string = string,
  TInput = any,
  TOutput = any
> = (value: TInput) => QueryTag<TName, TOutput>

function tag<
  const TName extends string,
>(name: TName): QueryTag<TName, undefined>

function tag<
  const TName extends string,
  const TInput,
  const TOutput,
>(name: TName, callback: QueryTagCallback<TInput, TOutput>): QueryTagFactory<TName, TInput, TOutput>

function tag(name: string, callback?: QueryTagCallback): QueryTag | QueryTagFactory {
  const id = Symbol();

  if(callback) {
    return (value: unknown) => ({ 
      id, 
      name,
      value: callback(value),
    })
  } 

  return {
    id,
    value: undefined,
    name,
  }
}

type User = {
  id: string
}

const tags = {
  users: tag('users'),
  user: tag('user', (user: User) => user.id),
} as const

type GetTag<TInput extends QueryTag | QueryTagFactory> = TInput extends QueryTag 
  ? TInput
  : TInput extends QueryTagFactory 
    ? ReturnType<TInput> 
    : never

type GetTags<TInput extends Record<string, QueryTag | QueryTagFactory>> = {
  [K in keyof TInput]: GetTag<TInput[K]>
}[keyof TInput]

type MyTags = GetTags<typeof tags>

function test(tag: MyTags) {
  return tag
}

test(tag())
test(tags.users)
test(tags.user)
test(tags.user({ id: '1' }))
