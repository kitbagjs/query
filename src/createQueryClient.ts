import { QueryAction, QueryOptions } from "./types/query";
import { ClientOptions } from "./types/clientOptions";
import {
  DefinedQueryComposition,
  DefinedQueryFunction,
  DefineQuery,
  QueryClient,
  QueryComposition,
  QueryDataSetter,
  QueryFunction,
  SetQueryData,
} from "./types/client";
import { createQueryGroups } from "./createQueryGroups";
import { createUseQuery } from "./createUseQuery";
import { isQueryTag, isQueryTags, QueryTag } from "./types/tags";
import { assert } from "./utilities/assert";

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

  const setQueryData: SetQueryData = (
    tagOrAction: QueryTag | QueryTag[] | QueryAction,
    parametersOrSetter: QueryDataSetter | Parameters<QueryAction>,
    maybeSetter?: QueryDataSetter
  ) => {
    if (isQueryTag(tagOrAction)) {
      return setQueryDataByTag(tagOrAction, parametersOrSetter as QueryDataSetter)
    }

    if (isQueryTags(tagOrAction)) {
      return setQueryDataByTags(tagOrAction, parametersOrSetter as QueryDataSetter)
    }

    if (typeof tagOrAction === 'function') {
      if (typeof parametersOrSetter === 'function') {
        return setQueryDataByAction(tagOrAction, parametersOrSetter as QueryDataSetter)
      }

      return setQueryDataByActionAndParameters(tagOrAction, parametersOrSetter as Parameters<QueryAction>, maybeSetter as QueryDataSetter)
    }

    assert(tagOrAction, 'Invalid arguments given to setQueryData')
  }


  function setQueryDataByTag(tag: QueryTag, setter: QueryDataSetter) {
    throw new Error('Not implemented')
  }

  function setQueryDataByTags(tags: QueryTag[], setter: QueryDataSetter) {
    throw new Error('Not implemented')
  }

  function setQueryDataByAction(action: QueryAction, setter: QueryDataSetter) {
    throw new Error('Not implemented')
  }

  function setQueryDataByActionAndParameters(action: QueryAction, parameters: Parameters<QueryAction>, setter: QueryDataSetter) {
    throw new Error('Not implemented')
  }

  return {
    query,
    useQuery,
    defineQuery,
    setQueryData,
  }
}