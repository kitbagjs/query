import { MutationFunction, MutationComposition, DefineMutation } from './mutation'
import { Query, QueryOptions, QueryAction, QueryActionArgs, QueryData } from './query'
import { QueryTag, QueryTagType } from './tags'
import { DefaultValue } from './utilities'

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
  const TPlaceholder
>(action: TAction, args: Parameters<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type DefinedQueryFunction<
  TAction extends QueryAction,
  TDefinedPlaceholder
> = <
  const TPlaceholder
>(args: Parameters<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>

export type UseQueryOptions<
  TAction extends QueryAction = QueryAction,
  TPlaceholder = unknown
> = QueryOptions<TAction, TPlaceholder> & {
  immediate?: boolean,
}

export type QueryComposition = <
  const TAction extends QueryAction,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  const Args extends QueryActionArgs<TAction>,
  const TPlaceholder
>(action: TAction, args: Args, options?: UseQueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type DefinedQueryComposition<
  TAction extends QueryAction,
  TDefinedPlaceholder
> = <
  const TPlaceholder
>(args: QueryActionArgs<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, DefaultValue<TPlaceholder, TDefinedPlaceholder>>

export type DefineQuery = <
  const TAction extends QueryAction,
  const TPlaceholder
>(action: TAction, options?: QueryOptions<TAction, TPlaceholder>) => DefinedQuery<TAction, TPlaceholder>

export type DefinedQuery<
  TAction extends QueryAction,
  TPlaceholder
> = {
  query: DefinedQueryFunction<TAction, TPlaceholder>,
  useQuery: DefinedQueryComposition<TAction, TPlaceholder>,
}

export type QueryDataSetter<T = unknown> = (data: T) => T

export type SetQueryData = {
  <TQueryTag extends QueryTag>(tag: TQueryTag | TQueryTag[], setter: QueryDataSetter<QueryTagType<TQueryTag>>): void,
  <TAction extends QueryAction>(action: TAction, setter: QueryDataSetter<QueryData<TAction>>): void,
  <TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>, setter: QueryDataSetter<QueryData<TAction>>): void,
}

export type RefreshQueryData = {
  <TQueryTag extends QueryTag>(tag: TQueryTag | TQueryTag[]): void,
  (action: QueryAction): void,
  <TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>): void,
}
