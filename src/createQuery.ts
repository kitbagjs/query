import { computed, onScopeDispose, reactive, toRefs, toValue, watch } from "vue";
import { createManager } from "./createManager";
import { CreateQueryOptions, Query, QueryAction, QueryActionArgs, QueryOptions } from "./types";
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities";

export type QueryFunction = <TAction extends QueryAction>(action: TAction, args: Parameters<TAction>, options?: QueryOptions) => Query<TAction>
export type QueryComposition = <TAction extends QueryAction>(action: TAction, args: QueryActionArgs<TAction>, options?: QueryOptions) => Query<TAction>

export type CreateQuery = {
  query: QueryFunction,
  useQuery: QueryComposition
}

const noop = () => undefined

export function createQuery(options?: CreateQueryOptions): CreateQuery {
  const manager = createManager(options)

  const query: QueryFunction = (action, args, options) => {
    const query = manager.subscribe(action, args, options)

    return Object.assign(query, {
      [Symbol.dispose]: () => {
        query.unsubscribe()
      },
      [Symbol.asyncDispose]: () => {
        query.unsubscribe()
      }
    })
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    const value = query(noop, [])

    watch(() => toValue(parameters), (parameters, previousParameters) => {
      if(isDefined(previousParameters) && isEqual(previousParameters, parameters)) {
        return
      }

      value.unsubscribe()

      if(parameters === null) {
        Object.assign(value, query(noop, []))
        return
      }

      const newValue = query(action, parameters, options)

      Object.assign(value, reactive({
        ...toRefs(newValue),
        response: computed(() => {
          if(newValue.executed) {
            return newValue.response
          }

          return value.response
        })
      }))

    }, { deep: true, immediate: true })

    onScopeDispose(() => value.unsubscribe())

    return value
  }

  return {
    query,
    useQuery,
  }
}