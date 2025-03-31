import { QueryAction, QueryOptions } from "./types/query";
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
import { createUseQuery } from "./createUseQuery";

export function createQueryClient(options?: ClientOptions): QueryClient {
  const { createQuery } = createQueryGroups(options)

  const query: QueryFunction = (action, args, options) => {
    return createQuery(action, args, options)
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    return createUseQuery(createQuery, action, parameters, options)
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