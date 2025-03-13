import { CreateQuery } from "./createQueryGroups"
import { Query, QueryAction, QueryActionArgs, QueryOptions } from "./types/query"
import { onScopeDispose, ref, toRef, toRefs, toValue, watch } from "vue"
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities"

type UseQueryOptions = {
  immediate?: boolean,
}

const noop = () => undefined

export function createUseQuery<
  TAction extends QueryAction,
  TArgs extends QueryActionArgs<TAction>,
  TOptions extends QueryOptions<TAction> & UseQueryOptions
>(createQuery: CreateQuery, action: TAction, parameters: TArgs, options?: TOptions): Query<TAction, TOptions>

export function createUseQuery(createQuery: CreateQuery, action: QueryAction, parameters: unknown[], options: QueryOptions<QueryAction> & UseQueryOptions = {}): Query<QueryAction, QueryOptions<QueryAction>> {
  const query = createQuery(noop, [], options)
  const enabled = ref(options?.immediate ?? true)
  const { promise, resolve, reject } = Promise.withResolvers()

  function enable() {
    enabled.value = true
  }

  watch(() => ({ enabled: enabled.value, parameters: toValue(parameters) }) as const, ({ enabled, parameters }, previous) => {
    if(previous && isDefined(previous.parameters) && isEqual(previous.parameters, parameters)) {
      return
    }

    query.dispose()

    if(parameters === null) {
      Object.assign(query, {
        response: toRef(() => options?.placeholder),
        executed: toRef(() => false),
        executing: false,
      })

      return
    }

    if(!enabled) {
      Object.assign(query, {
        execute: () => {
          enable()

          return promise
        },
      })

      return
    }

    const newValue = createQuery(action, parameters, {
      ...options,
      onSuccess: (response) => {
        if(previous?.enabled === false) {
          resolve(response)
        }

        options?.onSuccess?.(response)
      },
      onError: (error) => {
        if(previous?.enabled === false) {
          reject(error)
        }

        options?.onError?.(error)
      },
    })

    const previousResponse = query.response

    Object.assign(query, toRefs(newValue), {
      response: toRef(() => newValue.response ?? previousResponse)
    })
        
  }, { deep: true, immediate: true })

  onScopeDispose(() => query.dispose())

  return query
}