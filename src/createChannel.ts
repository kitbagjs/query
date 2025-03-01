import { computed, reactive, ref, toRefs } from "vue";
import { Query, QueryAction, QueryOptions } from "./types/query";
import { createSequence } from "./createSequence";
import { QueryError } from "./queryError";
import { createIntervalController } from "./services/intervalController";

export type Channel<
  TAction extends QueryAction = QueryAction,
> = {
  subscribe: <TOptions extends QueryOptions<TAction>>(options?: TOptions) => Query<TAction, TOptions>,
  active: boolean,
  interval: number,
}

export function createChannel<
  TAction extends QueryAction,
>(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
  type ChannelQuery = Query<TAction, QueryOptions<TAction>>

  const intervalController = createIntervalController()

  const response = ref<ChannelQuery['response']>()
  const error = ref<ChannelQuery['error']>()
  const errored = ref<ChannelQuery['errored']>(false)
  const lastExecuted = ref<number>()
  const executing = ref<ChannelQuery['executing']>(false)
  const { promise, resolve } = Promise.withResolvers()

  const subscriptions = new Map<number, QueryOptions<TAction>>()
  const nextId = createSequence()

  async function execute(): Promise<void> {
    executing.value = true

    try {
      const value = await action(...parameters)
      
      setResponse(value)
      
      lastExecuted.value = Date.now()
      error.value = undefined
      errored.value = false
    } catch(err) {
      setError(err)
    }

    executing.value = false
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

  function addSubscription(options?: QueryOptions<TAction>): () => void {
    const id = nextId()

    subscriptions.set(id, options ?? {})  

    if(lastExecuted.value === undefined && !executing.value) {
      execute()
    }

    intervalController.set(execute, () => channel.interval)

    return () => {
      subscriptions.delete(id)
    }
  }

  function subscribe<
    TOptions extends QueryOptions<TAction>
  >(options?: TOptions): Query<TAction, TOptions> {
    const removeSubscription = addSubscription(options)

    function dispose(): void {
      removeSubscription()
      intervalController.clear()
    }

    const query: Omit<Query<TAction, TOptions>, 'then' | typeof Symbol.dispose> = reactive({
      response: computed(() => response.value ?? options?.placeholder),
      executed: computed(() => lastExecuted.value !== undefined),
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

  const channel = {
    subscribe,
    get active() {
      return subscriptions.size > 0
    },
    get interval(): number {
      const intervals = Array
        .from(subscriptions.values())
        .map(subscription => subscription.interval ?? Infinity)
  
      return Math.min(...intervals)
    }
  } satisfies Channel<TAction>

  return channel
}