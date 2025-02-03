import { reactive, ref, toRefs } from "vue";
import { AwaitedQuery, Query, QueryAction, QueryOptions } from "./types";
import { sequence } from "./utils";
import { isPromise } from "./utilities";

export type Channel<TAction extends QueryAction = any> = {
  subscriptions: Map<number, QueryOptions>,
  subscribe: (options?: QueryOptions) => Query<TAction>,
}

export function createChannel<TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
  const response = ref<Query<TAction>['response']>()
  const error = ref<Query<TAction>['error']>()
  const errored = ref<Query<TAction>['errored']>(false)
  const executing = ref<Query<TAction>['executing']>(false)
  const executed = ref<Query<TAction>['executed']>(false)
  const { promise, resolve, reject } = Promise.withResolvers<void>()

  const subscriptions = new Map<number, QueryOptions>()
  const { next: nextId } = sequence()

  function execute(): void {
    executing.value = true

    try {
      const value = action(parameters)

      if(isPromise(value)) {
        value.then(value => {
          response.value = value as Awaited<ReturnType<TAction>>
          resolve()
        })
      } else {
        response.value = value
      }
    } catch(err) {
      error.value = err
      errored.value = true
      reject(err)

      return
    } finally {
      executed.value = true
      executing.value = false
    }

    error.value = undefined
    errored.value = false
  }

  function update(): void {
    if(!executed.value) {
      execute()
    }
  }

  function addSubscription(options?: QueryOptions): () => void {
    const id = nextId()

    subscriptions.set(id, options ?? {})

    update()

    return () => {
      subscriptions.delete(id)
      update()
    }
  }

  function subscribe(options?: QueryOptions): Query<TAction> {
    const dispose = addSubscription(options)

    const query: Omit<Query<TAction>, 'then'> = reactive({
      response,
      error,
      errored,
      executing,
      executed,
      dispose,
    })

    const then: Query<TAction>['then'] = (callback: (value: AwaitedQuery<TAction>) => void) => {
      promise.then(() => callback(query as AwaitedQuery<TAction>))
    }

    return reactive({
      ...toRefs(query),
      then
    })
  }

  return {
    subscriptions,
    subscribe
  }
}