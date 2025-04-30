import { Ref, ref } from "vue";
import { AwaitedQuery, Query, QueryAction, QueryOptions } from "./types/query";
import { QueryError } from "./queryError";
import { createIntervalController } from "./services/intervalController";
import { retry, RetryOptions } from "./utilities/retry";

export type QueryGroup<
  TAction extends QueryAction = QueryAction,
> = {
  data: Ref<Query<TAction, QueryOptions<TAction>>['data']>,
  error: Ref<Query<TAction, QueryOptions<TAction>>['error']>,
  errored: Ref<Query<TAction, QueryOptions<TAction>>['errored']>,
  executing: Ref<Query<TAction, QueryOptions<TAction>>['executing']>,
  executed: Ref<Query<TAction, QueryOptions<TAction>>['executed']>,
  promise: Promise<AwaitedQuery<TAction>>,
  execute: () => Promise<AwaitedQuery<TAction>>,
}

export type QueryGroupOptions = {
  retries?: number | Partial<RetryOptions>,
  onDispose?: () => void,
}

export function createQueryGroup<
  TAction extends QueryAction,
>(action: TAction, parameters: Parameters<TAction>, options?: QueryGroupOptions): QueryGroup<TAction> {
  type Group = Query<TAction, QueryOptions<TAction>>

  const intervalController = createIntervalController()
  let lastExecuted: number | undefined = undefined
  
  const data = ref<Group['data']>()
  const error = ref<Group['error']>()
  const errored = ref<Group['errored']>(false)
  const executing = ref<Group['executing']>(false)
  const executed = ref<Group['executed']>(false)
  const { promise, resolve } = Promise.withResolvers()

  async function execute(): Promise<AwaitedQuery<TAction>> {
    lastExecuted = Date.now()
    executing.value = true

    try {
      const value = await retry(() => action(...parameters), {count: 1, delay: 300})
      
      setData(value)

      return data.value
    } catch(error) {
      setError(error)

      throw error
    } finally {
      executing.value = false
      executed.value = true
    } 
  }

  function setData(value: Awaited<ReturnType<TAction>>): void {
    error.value = undefined
    errored.value = false
    data.value = value

    resolve(value)
  }

  function setError(value: unknown): void {
    error.value = value
    errored.value = true

    resolve(new QueryError(value))
  }

  return {
    data,
    error,
    errored,
    executing,
    executed,
    promise: promise as any,
    execute,
  }
}