import { computed, reactive, ref, toRefs } from "vue";
import { AwaitedQuery, Query, QueryAction, QueryData, QueryOptions } from "./types/query";
import { createQueryId } from "./createSequence";
import { QueryError } from "./queryError";
import { createIntervalController } from "./services/intervalController";
import { QueryTag } from "./types/tags";
import { log } from "./services/loggingService";
import { reduceRetryOptions, retry, RetryOptions } from "./utilities/retry";
import { createQueryGroupTags } from "./createQueryGroupTags";

export type QueryGroup<
  TAction extends QueryAction = QueryAction,
> = {
  createQuery: <TOptions extends QueryOptions<TAction>>(options?: TOptions) => Query<TAction, TOptions>,
  setData: (data: QueryData<TAction>) => void,
  getData: () => QueryData<TAction>,
  hasTag: (tag: QueryTag | QueryTag[]) => boolean,
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

  const queries = new Map<number, QueryOptions<TAction>>()
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

    for(const { onSuccess } of queries.values()) {
      onSuccess?.(value)
    }

    resolve(value)
  }

  function getData(): QueryData<TAction> {
    return data.value
  }

  function setError(value: unknown): void {
    error.value = value
    errored.value = true

    for(const { onError } of queries.values()) {
      onError?.(value)
    }

    resolve(new QueryError(value))
  }

  function setTags(): void {
    tags.clear()

    for(const [id, { tags }] of queries.entries()) {
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

    tags.addAllTags(tagsToAdd, id)
  }

  function hasTag(tag: QueryTag | QueryTag[]): boolean {
    if(Array.isArray(tag)) {
      return tag.some(t => tags.has(t))
    }

    return tags.has(tag)
  }

  function removeQuery(queryId: number): void {
    queries.delete(queryId)
    tags.removeAllTagsByQueryId(queryId)

    if(queries.size === 0) {
      options?.onDispose?.()
    }
  }

  function addQuery(options?: QueryOptions<TAction>): () => void {
    const queryId = createQueryId()

    queries.set(queryId, options ?? {})  

    setNextExecution()
    addTags(options?.tags, queryId)

    return () => removeQuery(queryId)
  }

  function setNextExecution(): void {
    const interval = getNextInterval()

    intervalController.set(safeExecute, interval)
  }

  function getNextInterval(): number {
    if(lastExecuted === undefined) {
      return 0
    }

    const interval = getInterval()
    const timeLeftSinceLastExecution = Date.now() - lastExecuted

    return interval - timeLeftSinceLastExecution
  }

  function getInterval(): number {
    const intervals = Array
      .from(queries.values())
      .map(query => query.interval ?? Infinity)
  
    return Math.min(...intervals)
  }

  function getRetryOptions(): RetryOptions {
    const retries = Array
      .from(queries.values())
      .map(query => query.retries)
    
    retries.push(options?.retries)

    return reduceRetryOptions(retries)
  }

  function createQuery<
    TOptions extends QueryOptions<TAction>
  >(options?: TOptions): Query<TAction, TOptions> {
    const removeQuery = addQuery(options)

    function dispose(): void {
      removeQuery()
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
    createQuery,
    setData,
    getData,
    hasTag,
    execute,
  }
}