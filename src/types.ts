type MaybeGetter<T> = T | Getter<T>
type Getter<T> = () => T

export type CreateClientOptions = {
  pauseActionsInBackground: boolean
}

export type QueryAction = (...args: any[]) => any

export type QueryActionArgs<TAction extends QueryAction> = MaybeGetter<Parameters<TAction>> | Getter<null>

export type QueryLifecycle = 'app' | 'route' | 'component'

export type QueryOptions<TAction extends QueryAction> = {
  maxAge?: number,
  lifecycle?: QueryLifecycle
  onSuccess?: (value: Awaited<ReturnType<TAction>>) => void,
  onError?: (error: unknown) => void,
}

export type Query<TAction extends QueryAction> = PromiseLike<AwaitedQuery<TAction>> & {
  response: Awaited<ReturnType<TAction>> | undefined,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  dispose: () => void,
}

export type AwaitedQuery<TAction extends QueryAction> = {
  response: Awaited<ReturnType<TAction>>,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  dispose: () => void,
}

export type DisposableQuery<TAction extends QueryAction> = Query<TAction> & {
  [Symbol.dispose](): void;
}
