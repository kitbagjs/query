import { computed, reactive, ref, toRefs } from "vue";
import { AwaitedQuery, Query, QueryAction, QueryOptions } from "./types/query";
import { createSequence } from "./createSequence";
import { QueryError } from "./queryError";
import { createIntervalController } from "./services/intervalController";
import { QueryTagKey, QueryTag } from "./types/tags";

export type QueryGroup<
  TAction extends QueryAction = QueryAction,
> = {
  subscribe: <TOptions extends QueryOptions<TAction>>(options?: TOptions) => Query<TAction, TOptions>,
  hasTag: (tag: QueryTag) => boolean,
  execute: () => Promise<AwaitedQuery<TAction>>,
  active: boolean,
}

export function createQueryGroup<
  TAction extends QueryAction,
>(action: TAction, parameters: Parameters<TAction>): QueryGroup<TAction> {
  type Group = Query<TAction, QueryOptions<TAction>>

  const intervalController = createIntervalController()

  const response = ref<Group['response']>()
  const error = ref<Group['error']>()
  const errored = ref<Group['errored']>(false)
  const lastExecuted = ref<number>()
  const executing = ref<Group['executing']>(false)
  const executed = computed<Group['executed']>(() => lastExecuted.value !== undefined)
  const { promise, resolve } = Promise.withResolvers()

  const subscriptions = new Map<number, QueryOptions<TAction>>()
  const nextId = createSequence()
  const tags = new Set<QueryTagKey>()

  async function execute(): Promise<AwaitedQuery<TAction>> {
    executing.value = true

    try {
      const value = await action(...parameters)
      
      setResponse(value)
      setTags()
      
      error.value = undefined
      errored.value = false
    } catch(err) {
      setError(err)
    }
    
    lastExecuted.value = Date.now()
    executing.value = false
    
    setNextExecution()

    return response.value
  }

  function setResponse(value: Awaited<ReturnType<TAction>>): void {
    response.value = value

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

    for(const { tags } of subscriptions.values()) {
      addTags(tags)
    }
  }

  function addTags(tagsToAdd: QueryOptions<TAction>['tags']): void {
    if(!executed.value) {
      return
    }

    if(!tagsToAdd) {
      return
    }

    if(typeof tagsToAdd === 'function') {
      const tags = tagsToAdd(response.value)
      
      return addTags(tags)
    }

    tagsToAdd.forEach(tag => tags.add(tag.key))
  }

  function hasTag(tag: QueryTag): boolean {
    return tags.has(tag.key)
  }

  function addSubscription(options?: QueryOptions<TAction>): () => void {
    const id = nextId()

    subscriptions.set(id, options ?? {})  

    setNextExecution()
    addTags(options?.tags)

    return () => {
      subscriptions.delete(id)
      setTags()
    }
  }

  function setNextExecution(): void {
    if(executing.value) {
      return
    }

    const interval = getNextSubscriptionInterval()

    intervalController.set(execute, interval)
  }

  function getNextSubscriptionInterval(): number {
    if(lastExecuted.value === undefined) {
      return 0
    }

    const interval = getSubscriptionInterval()
    const timeLeftSinceLastExecution = Date.now() - lastExecuted.value

    return interval - timeLeftSinceLastExecution
  }

  function getSubscriptionInterval(): number {
    const intervals = Array
      .from(subscriptions.values())
      .map(subscription => subscription.interval ?? Infinity)
  
    return Math.min(...intervals)
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
      response: computed(() => response.value ?? options?.placeholder),
      executed,
      error,
      errored,
      executing,
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