import { reactive, ref, toRefs } from "vue";
import { MutationAction, MutationOptions, Mutation, MutationData, MutationTags } from "./types/mutation";
import { QueryError } from "./queryError";
import { reduceRetryOptions, retry, RetryOptions } from "./utilities/retry";

export function createMutation<
  TAction extends MutationAction,
  TPlaceholder extends unknown,
  TTags extends MutationTags<TAction>,
>(action: TAction, options?: MutationOptions<TAction, TPlaceholder, TTags>): Mutation<TAction, TPlaceholder> {
  const data = ref()
  const executing = ref<boolean>(false)
  const executed = ref<boolean>(false)
  const error = ref<unknown>()
  const errored = ref<boolean>(false)
  const { promise, resolve } = Promise.withResolvers()

  async function mutate(...parameters: Parameters<TAction>): Promise<MutationData<TAction>> {
    executing.value = true

    options?.onExecute?.({ payload: parameters })

    try {
      const value = await retry(() => action(...parameters), getRetryOptions())
      
      setData(value, parameters)

      return value
    } catch(error) {
      setError(error, parameters)

      throw error
    } finally {
      executing.value = false
      executed.value = true
    } 
  }

  function setData(value: Awaited<ReturnType<TAction>>, parameters: Parameters<TAction>): void {
    error.value = undefined
    errored.value = false
    data.value = value

    options?.onSuccess?.({ payload: parameters, data: value })

    resolve(value)
  }

  function setError(value: unknown, parameters: Parameters<TAction>): void {
    error.value = value
    errored.value = true

    options?.onError?.({ payload: parameters, error: value })

    resolve(new QueryError(value))
  }

  function getRetryOptions(): RetryOptions {
    return reduceRetryOptions([options?.retries])
  }

  const mutation: Omit<Mutation<TAction, TPlaceholder>, 'then'> = reactive({
    data,
    executing,
    executed,
    error,
    errored,
    mutate,
  })

  const then: Mutation<TAction, TPlaceholder>['then'] = (onFulfilled: any, onRejected: any) => {
    return promise.then((value) => {
      if(value instanceof QueryError) {
        throw value.original
      }

      return mutation
    }).then(onFulfilled, onRejected)
  }

  return reactive({
    ...toRefs(mutation),
    then
  })
}