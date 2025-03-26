import { RetryOptions } from "@/utilities/retry";
import { Getter, MaybeGetter } from "./getters";
import { QueryTag, Unset } from "@/types/tags";

export type QueryAction = (...args: any[]) => any

export type QueryActionArgs<
  TAction extends QueryAction
> = MaybeGetter<Parameters<TAction>> | Getter<Parameters<TAction> | null> | Getter<null>

export type QueryTags<
  TAction extends QueryAction,
> = QueryTag<Awaited<ReturnType<TAction>> | Unset>[] | ((value: Awaited<ReturnType<TAction>>) => QueryTag<Awaited<ReturnType<TAction>> | Unset>[])

export type QueryOptions<
  TAction extends QueryAction,
> = {
  placeholder?: any,
  interval?: number,
  onSuccess?: (value: Awaited<ReturnType<TAction>>) => void,
  onError?: (error: unknown) => void,
  tags?: QueryTags<TAction>,
  retries?: number | Partial<RetryOptions>,
}

export type Query<
  TAction extends QueryAction,
  TOptions extends QueryOptions<TAction>
> = PromiseLike<AwaitedQuery<TAction>> & {
  data: Awaited<ReturnType<TAction>> | TOptions['placeholder'],
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
  data: Awaited<ReturnType<TAction>>,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  execute: () => Promise<AwaitedQuery<TAction>>,
  dispose: () => void,
  [Symbol.dispose](): void;
}