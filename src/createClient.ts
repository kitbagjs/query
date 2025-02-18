import { computed, onScopeDispose, toValue, watch } from "vue";
import { ClientOptions, Query, QueryAction, QueryActionArgs, QueryOptions } from "./types";
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities";
import { createGetQueryKey } from "./createQueryKey";
import { Channel, createChannel } from "./createChannel";
import { QueryKey } from "./createQueryKey";

export type QueryClient = {
  query: QueryFunction,
  useQuery: QueryComposition,
  defineQuery: DefineQuery,
}

export type QueryFunction = <
  TAction extends QueryAction
>(action: TAction, args: Parameters<TAction>, options?: QueryOptions<TAction>) => Query<TAction>

export type DefinedQueryFunction<
  TAction extends QueryAction
> = (args: Parameters<TAction>, options?: QueryOptions<TAction>) => Query<TAction>

export type QueryComposition = <
  const TAction extends QueryAction,
  const Args extends QueryActionArgs<TAction>
>(action: TAction, args: Args, options?: QueryOptions<TAction>) => Query<TAction>

export type DefinedQueryComposition<
  TAction extends QueryAction
> = (args: QueryActionArgs<TAction>, options?: QueryOptions<TAction>) => Query<TAction>

export type DefineQuery = <
  const TAction extends QueryAction
>(action: TAction) => DefinedQuery<TAction>

export type DefinedQuery<
  TAction extends QueryAction
> = {
  query: DefinedQueryFunction<TAction>
  useQuery: DefinedQueryComposition<TAction>
}

const noop = () => undefined

export function createClient(options?: ClientOptions): QueryClient {
  const getQueryKey = createGetQueryKey()
  const channels = new Map<QueryKey, Channel>()

  function getChannel<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
    const queryKey = getQueryKey(action, parameters)

    if(!channels.has(queryKey)) {
      channels.set(queryKey, createChannel(action, parameters))
    }

    return channels.get(queryKey)!
  }

  function subscribe<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>, options?: QueryOptions<TAction>): Query<TAction> {
    const channel = getChannel(action, parameters)

    return channel.subscribe(options)
  }

  const query: QueryFunction = (action, args, options) => {
    return subscribe(action, args, options)
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    const value = query(noop, [])

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
        // todo: this probably doesn't even work
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