import { computed, reactive, ref, toRefs } from "vue";
import { AwaitedQuery, Query, QueryAction, QueryOptions } from "./types/query";
import { createSequence } from "./createSequence";
import { QueryError } from "./queryError";
import { createIntervalController } from "./services/intervalController";
import { QueryTag } from "./types/tags";
import { log } from "./services/loggingService";
import { reduceRetryOptions, retry, RetryOptions } from "./utilities/retry";
import { createQueryGroupTags } from "./createQueryGroupTags";

export type QueryGroup<
  TAction extends QueryAction = QueryAction,
> = {
  subscribe: <TOptions extends QueryOptions<TAction>>(options?: TOptions) => Query<TAction, TOptions>,
  hasTag: (tag: QueryTag) => boolean,
  execute: () => Promise<AwaitedQuery<TAction>>,
  active: boolean,
}

export type QueryGroupOptions = {
  retries?: number | Partial<RetryOptions>
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

  const subscriptions = new Map<number, QueryOptions<TAction>>()
  const nextId = createSequence()
  const tags = createQueryGroupTags()

  async function execute(): Promise<AwaitedQuery<TAction>> {
    lastExecuted = Date.now()
    executing.value = true

    try {
      const value = await retry(() => action(...parameters), getRetryOptions())
      
      setData(value)
      setTags()
      setNextExecution()

      return data.value
    } catch(error) {
      setError(error)

      throw error
    } finally {
      executing.value = false
      executed.value = true
    } 
  }

  async function safeExecute(): Promise<void> {
    try {
      await execute()
    } catch(error) {
      log(error)
    }
  }

  function setData(value: Awaited<ReturnType<TAction>>): void {
    error.value = undefined
    errored.value = false
    data.value = value

    for(const { onSuccess } of subscriptions.values()) {
      onSuccess?.(value)
    }

    resolve(value)
  }

  function setError(value: unknown): void {
    error.value = value
    errored.value = true

    for(const { onError } of subscriptions.values()) {
      onError?.(value)
    }

    resolve(new QueryError(value))
  }

  function setTags(): void {
    tags.clear()

    for(const [id, { tags }] of subscriptions.entries()) {
      addTags(tags, id)
    }
  }

  function addTags(tagsToAdd: QueryOptions<TAction>['tags'], id: number): void {
    if(lastExecuted === undefined) {
      return
    }

    if(!tagsToAdd) {
      return
    }

    if(typeof tagsToAdd === 'function') {
      const tags = tagsToAdd(data.value)
      
      return addTags(tags, id)
    }

    tags.addAll(tagsToAdd, id)
  }

  function hasTag(tag: QueryTag): boolean {
    return tags.has(tag)
  }

  function addSubscription(options?: QueryOptions<TAction>): () => void {
    const id = nextId()

    subscriptions.set(id, options ?? {})  

    setNextExecution()
    addTags(options?.tags, id)

    return () => {
      subscriptions.delete(id)
      tags.removeAllById(id)
    }
  }

  function setNextExecution(): void {
    const interval = getNextSubscriptionInterval()

    intervalController.set(safeExecute, interval)
  }

  function getNextSubscriptionInterval(): number {
    if(lastExecuted === undefined) {
      return 0
    }

    const interval = getSubscriptionInterval()
    const timeLeftSinceLastExecution = Date.now() - lastExecuted

    return interval - timeLeftSinceLastExecution
  }

  function getSubscriptionInterval(): number {
    const intervals = Array
      .from(subscriptions.values())
      .map(subscription => subscription.interval ?? Infinity)
  
    return Math.min(...intervals)
  }

  function getRetryOptions(): RetryOptions {
    const retries = Array
      .from(subscriptions.values())
      .map(subscription => subscription.retries)
    
    retries.push(options?.retries)

    return reduceRetryOptions(retries)
  }

  function subscribe<
    TOptions extends QueryOptions<TAction>
  >(options?: TOptions): Query<TAction, TOptions> {
    const removeSubscription = addSubscription(options)

    function dispose(): void {
      removeSubscription()
      setNextExecution()
    }

    const query: Omit<Query<TAction, TOptions>, 'then' | typeof Symbol.dispose> = reactive({
      data: computed(() => data.value ?? options?.placeholder),
      executed,
      error,
      errored,
      executing,
      execute,
      dispose,
    })

    const then: Query<TAction, TOptions>['then'] = (onFulfilled: any, onRejected: any) => {
      return promise.then((value) => {
        if(value instanceof QueryError) {
          throw value.original
        }

        return Object.assign(query, {
          [Symbol.dispose]: () => {
            dispose()
          }
        })
      }).then(onFulfilled, onRejected)
    }

    return reactive({
      ...toRefs(query),
      then,
      [Symbol.dispose]: () => {
        dispose()
      }
    })
  }

  return {
    subscribe,
    hasTag,
    execute,
    get active() {
      return subscriptions.size > 0
    },
  }
}