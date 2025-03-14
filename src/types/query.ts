import { RetryOptions } from "@/utilities/retry";
import { Getter, MaybeGetter } from "./getters";
import { QueryTag } from "@/types/tags";

export type QueryAction = (...args: any[]) => any

export type QueryActionArgs<
  TAction extends QueryAction
> = MaybeGetter<Parameters<TAction>> | Getter<Parameters<TAction> | null> | Getter<null>

export type QueryOptions<
  TAction extends QueryAction,
> = {
  placeholder?: any,
  interval?: number,
  onSuccess?: (value: Awaited<ReturnType<TAction>>) => void,
  onError?: (error: unknown) => void,
  tags?: QueryTag[] | ((value: Awaited<ReturnType<TAction>>) => QueryTag[])
  retries?: number | Partial<RetryOptions>,
}

export type ExtractQueryOptionsFromQuery<
  TQuery extends Query<any, any>
> = TQuery extends Query<any, infer TOptions> ? TOptions : never

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