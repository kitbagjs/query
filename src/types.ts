type MaybeGetter<T> = T | Getter<T>
type Getter<T> = () => T
type MaybePromise<T> = T | Promise<T>

export type CreateQueryOptions = {
  pauseActionsInBackground: boolean
}

export type QueryAction = (...args: any[]) => MaybePromise<any>

export type QueryActionArgs<TAction extends QueryAction> = MaybeGetter<Parameters<TAction>> | Getter<null>

export type QueryLifecycle = 'app' | 'route' | 'component'

export type QueryOptions = {
  maxAge?: number,
  lifecycle?: QueryLifecycle
}

export type Query<TAction extends QueryAction> = {
  response: ReturnType<TAction> | undefined,
  error: unknown,
  errored: boolean,
  executed: boolean,
  executing: boolean,
  unsubscribe: () => void
}
