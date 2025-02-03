type MaybeGetter<T> = T | Getter<T>
type Getter<T> = () => T

export type CreateQueryOptions = {
  pauseActionsInBackground: boolean
}

export type QueryAction = (...args: any[]) => any

export type QueryActionArgs<TAction extends QueryAction> = MaybeGetter<Parameters<TAction>> | Getter<null>

export type QueryLifecycle = 'app' | 'route' | 'component'

export type QueryOptions = {
  maxAge?: number,
  lifecycle?: QueryLifecycle
}

export type Query<TAction extends QueryAction> = {
  response: Awaited<ReturnType<TAction>> | undefined,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  dispose: () => void,
  then: (callback: (value: AwaitedQuery<TAction>) => void) => void
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
