import { reactive, readonly, ref } from "vue";
import { Query, QueryAction, QueryOptions } from "./types";
import { sequence } from "./utils";

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

  const subscriptions = new Map<number, QueryOptions>()
  const { next: nextId } = sequence()

  function execute(): void {
    executing.value = true

    try {
      response.value = action(parameters)
    } catch(err) {
      error.value = err
      errored.value = true

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
    const unsubscribe = addSubscription(options)

    const query: Query<TAction> = readonly(reactive({
      response,
      error,
      errored,
      executing,
      executed,
      unsubscribe,
    }))

    return query
  }

  return {
    subscriptions,
    subscribe
  }
}