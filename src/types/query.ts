import { RetryOptions } from "@/utilities/retry";
import { Getter, MaybeGetter } from "./getters";
import { QueryTag, Unset } from "@/types/tags";

export type QueryAction = (...args: any[]) => any

export function isQueryAction(value: any): value is QueryAction {
  return typeof value === 'function'
}

export type QueryData<
  TAction extends QueryAction = QueryAction
> = Awaited<ReturnType<TAction>>

export type QueryActionArgs<
  TAction extends QueryAction
> = MaybeGetter<Parameters<TAction>> | Getter<Parameters<TAction> | null> | Getter<null>

export type QueryTags<
  TAction extends QueryAction = QueryAction,
> = QueryTag<QueryData<TAction> | Unset>[] | ((value: QueryData<TAction>) => QueryTag<QueryData<TAction> | Unset>[])

export type QueryOptions<
  TAction extends QueryAction,
> = {
  placeholder?: any,
  interval?: number,
  onSuccess?: (value: QueryData<TAction>) => void,
  onError?: (error: unknown) => void,
  tags?: QueryTags<TAction>,
  retries?: number | Partial<RetryOptions>,
}

export type Query<
  TAction extends QueryAction,
  TOptions extends QueryOptions<TAction>
> = PromiseLike<AwaitedQuery<TAction>> & {
  data: QueryData<TAction> | TOptions['placeholder'],
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  execute: () => Promise<AwaitedQuery<TAction>>,
  dispose: () => void,
  [Symbol.dispose](): void;
}

export type AwaitedQuery<
  TAction extends QueryAction,
> = {
  data: QueryData<TAction>,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  execute: () => Promise<AwaitedQuery<TAction>>,
  dispose: () => void,
  [Symbol.dispose](): void;
}