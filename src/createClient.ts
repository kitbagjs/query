import { onScopeDispose, toRef, toRefs, toValue, watch } from "vue";
import { QueryAction, QueryOptions } from "./types/query";
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities";
import { ClientOptions } from "./types/clientOptions";
import { 
  DefinedQueryComposition,
  DefinedQueryFunction,
  DefineQuery,
  QueryClient,
  QueryComposition,
  QueryFunction,
} from "./types/client";
import { createQueryGroups } from "./createQueryGroups";

const noop = () => undefined

export function createClient(options?: ClientOptions): QueryClient {
  const { createQuery } = createQueryGroups()

  const query: QueryFunction = (action, args, options) => {
    return createQuery(action, args, options)
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    const query = createQuery(noop, [], options)

    watch(() => toValue(parameters), (parameters, previousParameters) => {
      if(isDefined(previousParameters) && isEqual(previousParameters, parameters)) {
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

      const newValue = createQuery(action, parameters, options)
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