import { MutationFunction, MutationComposition, DefineMutation } from "./mutation"
import { QueryActionArgs, QueryData } from "./query"
import { Query } from "./query"
import { QueryOptions } from "./query"
import { QueryAction } from "./query"
import { QueryTag, QueryTagType } from "./tags"

export type QueryClient = {
  query: QueryFunction,
  useQuery: QueryComposition,
  defineQuery: DefineQuery,
  setQueryData: SetQueryData,
  refreshQueryData: RefreshQueryData,
  mutate: MutationFunction,
  useMutation: MutationComposition,
  defineMutation: DefineMutation,
}

export type QueryFunction = <
  const TAction extends QueryAction,
  const TOptions extends QueryOptions<TAction>
>(action: TAction, args: Parameters<TAction>, options?: TOptions) => Query<TAction, TOptions>

export type DefinedQueryFunction<
  TAction extends QueryAction,
  TOptions extends QueryOptions<TAction>
> = (args: Parameters<TAction>, options?: TOptions) => Query<TAction, TOptions>

export type UseQueryOptions<TAction extends QueryAction> = QueryOptions<TAction> & {
  immediate?: boolean,
}

export type QueryComposition = <
  const TAction extends QueryAction,
  const Args extends QueryActionArgs<TAction>,
  const TOptions extends UseQueryOptions<TAction>
>(action: TAction, args: Args, options?: TOptions) => Query<TAction, TOptions>

export type DefinedQueryComposition<
  TAction extends QueryAction,
  TOptions extends QueryOptions<TAction>
> = (args: QueryActionArgs<TAction>, options?: TOptions) => Query<TAction, TOptions>

export type DefineQuery = <
  const TAction extends QueryAction,
  const TOptions extends QueryOptions<TAction>
>(action: TAction, options?: TOptions) => DefinedQuery<TAction, TOptions>

export type DefinedQuery<
  TAction extends QueryAction,
  TOptions extends QueryOptions<TAction>
> = {
  query: DefinedQueryFunction<TAction, TOptions>
  useQuery: DefinedQueryComposition<TAction, TOptions>
}

export type QueryDataSetter<T = unknown> = (data: T) => T

export type SetQueryData = {
  <TQueryTag extends QueryTag>(tag: TQueryTag | TQueryTag[], setter: QueryDataSetter<QueryTagType<TQueryTag>>): void
  <TAction extends QueryAction>(action: TAction, setter: QueryDataSetter<QueryData<TAction>>): void
  <TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>, setter: QueryDataSetter<QueryData<TAction>>): void
}

export type RefreshQueryData = {
  <TQueryTag extends QueryTag>(tag: TQueryTag | TQueryTag[]): void
  <TAction extends QueryAction>(action: TAction): void
  <TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>): void
}