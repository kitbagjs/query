import { onScopeDispose, toRef, toRefs, toValue, watch } from "vue";
import { Query, QueryAction, QueryOptions } from "./types/query";
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities";
import { createGetChanelKey } from "./createQueryKey";
import { Channel, createChannel } from "./createChannel";
import { ChannelKey } from "./createQueryKey";
import { ClientOptions } from "./types/clientOptions";
import { DefinedQueryComposition, DefinedQueryFunction, DefineQuery, QueryClient, QueryComposition, QueryFunction } from "./types/client";

const noop = () => undefined

export function createClient(options?: ClientOptions): QueryClient {
  const getChannelKey = createGetChanelKey()
  const channels = new Map<ChannelKey, Channel>()

  function getChannel<
    TAction extends QueryAction,
  >(action: TAction, parameters: Parameters<TAction>): Channel<TAction> {
    const queryKey = getChannelKey(action, parameters)

    if(!channels.has(queryKey)) {
      channels.set(queryKey, createChannel(action, parameters))
    }

    return channels.get(queryKey)!
  }

  function subscribe<
    const TAction extends QueryAction,
    const TOptions extends QueryOptions<TAction>
  >(action: TAction, parameters: Parameters<TAction>, options?: TOptions): Query<TAction, TOptions> {
    const channel = getChannel(action, parameters)

    return channel.subscribe(options)
  }

  const query: QueryFunction = (action, args, options) => {
    return subscribe(action, args, options)
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    const query = subscribe(noop, [], options)

    watch(() => toValue(parameters), (parameters, previousParameters) => {
      if(isDefined(previousParameters) && isEqual(previousParameters, parameters)) {
        return
      }

      query.dispose()

      if(parameters === null) {
        Object.assign(query, {
          response: toRef(() => options?.placeholder),
        })

        return
      }

      const newValue = subscribe(action, parameters, options)
      const previousResponse = query.response

      Object.assign(query, toRefs(newValue), {
        response: toRef(() => newValue.response ?? previousResponse)
      })
          
    }, { deep: true, immediate: true })

    onScopeDispose(() => query.dispose())

    return query
  }

  const defineQuery: DefineQuery = <
    TAction extends QueryAction,
    TOptions extends QueryOptions<TAction>
  >(action: TAction) => {
    const definedQuery: DefinedQueryFunction<TAction, TOptions> = (args, options) => {
      return query(action, args, options)
    }

    const definedUseQuery: DefinedQueryComposition<TAction, TOptions> = (args, options) => {
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