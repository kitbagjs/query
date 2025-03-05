import { QueryTag } from "@/tag";
import { Getter, MaybeGetter } from "./getters";

export type QueryAction = (...args: any[]) => any

export type QueryActionArgs<
  TAction extends QueryAction
> = MaybeGetter<Parameters<TAction>> | Getter<Parameters<TAction> | null> | Getter<null>

export type QueryOptions<
  TAction extends QueryAction,
> = {
  placeholder?: any,
  onSuccess?: (value: Awaited<ReturnType<TAction>>) => void,
  onError?: (error: unknown) => void,
  tags?: QueryTag[] | ((value: Awaited<ReturnType<TAction>>) => QueryTag[])
}

export type ExtractQueryOptionsFromQuery<
  TQuery extends Query<any, any>
> = TQuery extends Query<any, infer TOptions> ? TOptions : never

export type Query<
  TAction extends QueryAction,
  TOptions extends QueryOptions<TAction>
> = PromiseLike<AwaitedQuery<TAction>> & {
  response: Awaited<ReturnType<TAction>> | TOptions['placeholder'],
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  dispose: () => void,
  [Symbol.dispose](): void;
}

export type AwaitedQuery<
  TAction extends QueryAction,
> = {
  response: Awaited<ReturnType<TAction>>,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  dispose: () => void,
  [Symbol.dispose](): void;
}