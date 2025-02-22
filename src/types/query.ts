import { Getter, MaybeGetter } from "./getters";

export type QueryAction = (...args: any[]) => any

export type QueryActionArgs<TAction extends QueryAction> = MaybeGetter<Parameters<TAction>> | Getter<Parameters<TAction> | null> | Getter<null>

export type QueryOptions<
  TAction extends QueryAction,
  TPlaceholder extends unknown
> = {
  placeholder?: TPlaceholder,
  onSuccess?: (value: Awaited<ReturnType<TAction>>) => void,
  onError?: (error: unknown) => void,
}

type QueryPlaceholder<TPlaceholder extends unknown> = unknown extends TPlaceholder ? undefined : TPlaceholder

export type Query<
  TAction extends QueryAction,
  TPlaceholder extends unknown
> = PromiseLike<AwaitedQuery<TAction>> & {
  response: Awaited<ReturnType<TAction>> | QueryPlaceholder<TPlaceholder>,
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