import { computed, reactive, ref, toRefs } from "vue";
import { Query, QueryAction, QueryOptions } from "./types/query";
import { createSequence } from "./createSequence";

export type Channel<
  TAction extends QueryAction = any,
> = {
  subscribe: <TOptions extends QueryOptions<TAction>>(options?: TOptions) => Query<TAction, TOptions>,
  active: boolean,
}

export function createChannel<
  TAction extends QueryAction,
>(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
  type ChannelQuery = Query<TAction, QueryOptions<TAction>>

  const response = ref<ChannelQuery['response']>()
  const error = ref<ChannelQuery['error']>()
  const errored = ref<ChannelQuery['errored']>(false)
  const executing = ref<ChannelQuery['executing']>(false)
  const executed = ref<ChannelQuery['executed']>(false)
  const { promise, resolve } = Promise.withResolvers()

  const subscriptions = new Map<number, QueryOptions<TAction>>()
  const nextId = createSequence()

  async function execute(): Promise<void> {
    executing.value = true

    try {
      const value = await action(...parameters)

      setResponse(value)

      error.value = undefined
      errored.value = false
    } catch(err) {
      setError(err)
    }

    executed.value = true
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

    // wrap this somehow so we can rethrow it later
    resolve(value)
  }

  function addSubscription(options?: QueryOptions<TAction>): () => void {
    const id = nextId()

    subscriptions.set(id, options ?? {})  

    if(!executed.value && !executing.value) {
      execute()
    }

    return () => {
      subscriptions.delete(id)
    }
  }

  function subscribe<
    TOptions extends QueryOptions<TAction>
  >(options?: TOptions): Query<TAction, TOptions> {
    const dispose = addSubscription(options)

    const query: Omit<Query<TAction, TOptions>, 'then' | typeof Symbol.dispose> = reactive({
      response: computed(() => response.value ?? options?.placeholder),
      error,
      errored,
      executing,
      executed,
      dispose,
    })

    const then: Query<TAction, TOptions>['then'] = (onFulfilled: any, onRejected: any) => {
      return promise.then((value) => {
        if(value instanceof Error) {
          throw value
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
    get active() {
      return subscriptions.size > 0
    }
  }
}