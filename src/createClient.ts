import { computed, onScopeDispose, reactive, toValue, watch } from "vue";
import { createManager } from "./createManager";
import { ClientOptions, DisposableQuery, Query, QueryAction, QueryActionArgs, QueryOptions } from "./types";
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities";

export type QueryClient = {
  query: QueryFunction,
  useQuery: QueryComposition,
  defineQuery: DefineQuery,
}

export type QueryFunction = <
  TAction extends QueryAction
>(action: TAction, args: Parameters<TAction>, options?: QueryOptions<TAction>) => DisposableQuery<TAction>

export type DefinedQueryFunction<
  TAction extends QueryAction
> = (args: Parameters<TAction>, options?: QueryOptions<TAction>) => Query<TAction>

export type QueryComposition = <
  TAction extends QueryAction
>(action: TAction, args: QueryActionArgs<TAction>, options?: QueryOptions<TAction>) => Query<TAction>

export type DefinedQueryComposition<
  TAction extends QueryAction
> = (args: QueryActionArgs<TAction>, options?: QueryOptions<TAction>) => Query<TAction>

export type DefineQuery = <
  TAction extends QueryAction
>(action: TAction) => DefinedQuery<TAction>

export type DefinedQuery<
  TAction extends QueryAction
> = {
  query: DefinedQueryFunction<TAction>
  useQuery: DefinedQueryComposition<TAction>
}

const noop = () => undefined

export function createClient(options?: ClientOptions): QueryClient {
  const manager = createManager(options)

  const query: QueryFunction = (action, args, options) => {
    const query = manager.subscribe(action, args, options)

    return Object.assign(query, {
      [Symbol.dispose]: () => {
        query.dispose()
      },
    })
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    const value = reactive(query(noop, []))

    watch(() => toValue(parameters), (parameters, previousParameters) => {
      if(isDefined(previousParameters) && isEqual(previousParameters, parameters)) {
        return
      }

      value.dispose()

      if(parameters === null) {
        Object.assign(value, query(noop, []))
        return
      }

      const newValue = query(action, parameters, options)

      Object.assign(value, {
        ...newValue,
        response: computed(() => {
          if(newValue.executed) {
            return newValue.response
          }

          return value.response
        })
      })

    }, { deep: true, immediate: true })

    onScopeDispose(() => value.dispose())

    return value
  }

  const defineQuery: DefineQuery = <TAction extends QueryAction>(action: TAction) => {
    const definedQuery: DefinedQueryFunction<TAction> = (args, options) => {
      return query(action, args, options)
    }

    const definedUseQuery: DefinedQueryComposition<TAction> = (args, options) => {
      return useQuery(action, args, options)
    }

    return {
      query: definedQuery,
      useQuery: definedUseQuery,
    }
  }

  return {
    query,
    useQuery,
    defineQuery,
  }
}