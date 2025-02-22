import { QueryActionArgs } from "./query"
import { Query } from "./query"
import { QueryOptions } from "./query"
import { QueryAction } from "./query"

export type QueryClient = {
  query: QueryFunction,
  useQuery: QueryComposition,
  defineQuery: DefineQuery,
}

export type QueryFunction = <
  TAction extends QueryAction,
  TPlaceholder extends unknown
>(action: TAction, args: Parameters<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type DefinedQueryFunction<
  TAction extends QueryAction,
  TPlaceholder extends unknown
> = (args: Parameters<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type QueryComposition = <
  const TAction extends QueryAction,
  const Args extends QueryActionArgs<TAction>,
  const TPlaceholder extends unknown
>(action: TAction, args: Args, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type DefinedQueryComposition<
  TAction extends QueryAction,
  TPlaceholder extends unknown
> = (args: QueryActionArgs<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type DefineQuery = <
  const TAction extends QueryAction,
  const TPlaceholder extends unknown
>(action: TAction) => DefinedQuery<TAction, TPlaceholder>

export type DefinedQuery<
  TAction extends QueryAction,
  TPlaceholder extends unknown
> = {
  query: DefinedQueryFunction<TAction, TPlaceholder>
  useQuery: DefinedQueryComposition<TAction, TPlaceholder>
}