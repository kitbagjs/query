import { isQueryAction, QueryAction, QueryOptions } from "./types/query";
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
import { isArray } from "./utilities/arrays";
import { F } from "vitest/dist/chunks/reporters.QZ837uWx.js";
import { assertNever } from "./utilities/assert";
import { QueryGroup } from "./createQueryGroup";

export function createQueryClient(options?: ClientOptions): QueryClient {
  const { createQuery, getQueryGroups } = createQueryGroups(options)

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
    param1: QueryTag | QueryTag[] | QueryAction, 
    param2: Parameters<QueryAction> | QueryDataSetter, 
    param3?: QueryDataSetter
  ) => {
    const setDataForGroups = (groups: QueryGroup[], setter: QueryDataSetter) => {
      groups.forEach(group => {
        const data = group.getData()
        const newData = setter(data)
        
        group.setData(newData)
      })
    }

    if(isQueryTag(param1)) {
      const tag = param1
      const setter = param2 as QueryDataSetter
      const groups = getQueryGroups(tag)

      setDataForGroups(groups, setter)

      return
    }

    if(isQueryTags(param1)) {
      const tags = param1
      const setter = param2 as QueryDataSetter
      const groups = getQueryGroups(tags)

      setDataForGroups(groups, setter)

      return
    }

    if(isQueryAction(param1) && isArray(param2)) {
      const action = param1
      const parameters = param2
      const setter = param3 as QueryDataSetter
      const groups = getQueryGroups(action, parameters)

      setDataForGroups(groups, setter)

      return
    }

    if(isQueryAction(param1)) {
      const action = param1
      const setter = param2 as QueryDataSetter
      const groups = getQueryGroups(action)

      setDataForGroups(groups, setter)

      return
    }

    assertNever(param1, 'Invalid arguments given to setQueryData')
  }

  return {
    query,
    useQuery,
    defineQuery,
    setQueryData,
  }
}