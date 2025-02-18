import { reactive, ref, toRefs } from "vue";
import { Query, QueryAction, QueryOptions } from "./types";
import { createSequence } from "./createSequence";

export type Channel<TAction extends QueryAction = any> = {
  subscribe: (options?: QueryOptions<TAction>) => Query<TAction>,
  active: boolean,
}

export function createChannel<TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
  const response = ref<Query<TAction>['response']>()
  const error = ref<Query<TAction>['error']>()
  const errored = ref<Query<TAction>['errored']>(false)
  const executing = ref<Query<TAction>['executing']>(false)
  const executed = ref<Query<TAction>['executed']>(false)
  const { promise, resolve } = Promise.withResolvers<unknown>()

  const subscriptions = new Map<number, QueryOptions<TAction>>()
  const nextId = createSequence()

  async function execute(): Promise<void> {
    executing.value = true

    try {
      const value = await action(parameters)

      setResponse(value)
    } catch(err) {
      setError(err)
    } finally {
      executed.value = true
      executing.value = false
    }

    error.value = undefined
    errored.value = false
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

  function subscribe(options?: QueryOptions<TAction>): Query<TAction> {
    const dispose = addSubscription(options)

    const query: Omit<Query<TAction>, 'then' | typeof Symbol.dispose> = reactive({
      response,
      error,
      errored,
      executing,
      executed,
      dispose,
    })

    const then: Query<TAction>['then'] = (onFulfilled: any, onRejected: any) => {
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