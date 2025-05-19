import { isQueryAction, QueryAction, QueryData, QueryOptions } from "./types/query";
import { ClientOptions } from "./types/clientOptions";
import { 
  DefinedQueryComposition,
  DefinedQueryFunction,
  DefineQuery,
  QueryClient,
  QueryComposition,
  QueryDataSetter,
  QueryFunction,
  RefreshQueryData,
  SetQueryData,
} from "./types/client";
import { createQueryGroups } from "./createQueryGroups";
import { createUseQuery } from "./createUseQuery";
import { isQueryTag, isQueryTags, QueryTag } from "./types/tags";
import { isArray } from "./utilities/arrays";
import { assertNever } from "./utilities/assert";
import { QueryGroup } from "./createQueryGroup";
import { MutationComposition, MutationFunction, DefineMutation, DefinedMutationFunction, MutationAction, MutationTags, MutationOptions, DefinedMutationComposition } from "./types/mutation";
import { createMutation } from "./createMutation";
import { getAllTags } from "./getAllTags";
import { DefaultValue } from "./types/utilities";

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
  ): void => {
    const setDataForGroups = (groups: QueryGroup[], setter: QueryDataSetter): void => {
      groups.forEach(group => {
        const data = group.getData()
        const newData = setter(data)
        
        group.setData(newData)
      })
    }

    if(isQueryTag(param1) || isQueryTags(param1)) {
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

  const refreshQueryData: RefreshQueryData = (
    param1: QueryTag | QueryTag[] | QueryAction, 
    param2?: Parameters<QueryAction>, 
  ): void => {

    if(isQueryTag(param1) || isQueryTags(param1)) {
      const tags = param1
      const groups = getQueryGroups(tags)

      groups.forEach(group => {
        group.execute()
      })

      return
    }

    if(isQueryAction(param1)) {
      const action = param1
      const parameters = param2
      const groups = getQueryGroups(action, parameters)

      groups.forEach(group => {
        group.execute()
      })

      return
    }

    assertNever(param1, 'Invalid arguments given to setQueryData')
  }

  const mutate: MutationFunction = (action, parameters, options) => {
    const mutation = useMutation(action, options)
        
    mutation.mutate(...parameters).catch(() => {
      // silence here for now
      // later we'll want to automatically revert the `setQueryDataBefore`
    })

    return mutation
  }

  const useMutation: MutationComposition = (action, options) => {
    const { setQueryDataBefore, setQueryDataAfter, onExecute, onSuccess } = options ?? {}

    const mutation = createMutation(action, {
      ...options,
      onExecute: (context) => {
        if(setQueryDataBefore) {
          const tags = getAllTags(options?.tags, undefined)

          setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataBefore(queryData, context))
        }

        onExecute?.(context)
      },
      onSuccess: (context) => {
        const tags = getAllTags(options?.tags, context.data)

        if(options?.refreshQueryData ?? true) {
          refreshQueryData(tags)
        }

        if(setQueryDataAfter) {
          setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataAfter(queryData, context))
        }

        onSuccess?.(context)
      },
    })

    return mutation
  }

  const defineMutation: DefineMutation = <
    TDefinedAction extends MutationAction,
    TDefinedPlaceholder extends unknown,
    TDefinedTags extends MutationTags<TDefinedAction>
  >(action: TDefinedAction, definedOptions?: MutationOptions<TDefinedAction, TDefinedPlaceholder, TDefinedTags>) => {

    const definedMutation: DefinedMutationFunction<TDefinedAction, TDefinedPlaceholder> = (parameters, options) => {
      const mutation = definedUseMutation(options)

      mutation.mutate(...parameters).catch(() => {
        // silence here for now
        // later we'll want to automatically revert the `setQueryDataBefore`
      })

      return mutation
    }

    const definedUseMutation: DefinedMutationComposition<TDefinedAction, TDefinedPlaceholder> = (options) => {
      const { 
        setQueryDataBefore: definedSetQueryDataBefore, 
        setQueryDataAfter: definedSetQueryDataAfter, 
        onExecute: definedOnExecute, 
        onSuccess: definedOnSuccess,
        onError: definedOnError
      } = definedOptions ?? {}

      const placeholder = options?.placeholder ?? definedOptions?.placeholder

      const { 
        setQueryDataBefore, 
        setQueryDataAfter, 
        onExecute, 
        onSuccess,
        onError
      } = options ?? {}
  
      const mutation = createMutation(action, {
        placeholder,
        retries: options?.retries ?? definedOptions?.retries,
        refreshQueryData: options?.refreshQueryData ?? definedOptions?.refreshQueryData,
        tags: (data) => {
          const definedTags = getAllTags(definedOptions?.tags, data)
          const tags = getAllTags(options?.tags, data)

          return [...definedTags, ...tags]
        },
        onExecute: (context) => {
          if(setQueryDataBefore) {
            const tags = getAllTags(options?.tags, undefined)
            
            setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataBefore(queryData, context))
          }
          
          if(definedSetQueryDataBefore) {
            const definedTags = getAllTags(definedOptions?.tags, undefined)
            
            setQueryData(definedTags, (queryData: QueryData): QueryData => definedSetQueryDataBefore(queryData, context))
          }
  
          onExecute?.(context)
          definedOnExecute?.(context)
        },
        onSuccess: (context) => {
          const shouldRefreshQueryData = options?.refreshQueryData ?? definedOptions?.refreshQueryData ?? true
          const tags = getAllTags(options?.tags, context.data)
          const definedTags = getAllTags(definedOptions?.tags, context.data)
  
          if(shouldRefreshQueryData) {
            refreshQueryData(tags)
            refreshQueryData(definedTags)
          }
  
          if(setQueryDataAfter) {
            setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataAfter(queryData, context))
          }

          if(definedSetQueryDataAfter) {
            setQueryData(definedTags, (queryData: QueryData): QueryData => definedSetQueryDataAfter(queryData, context))
          }
  
          onSuccess?.(context)
          definedOnSuccess?.(context)
        },
        onError: (context) => {
          onError?.(context)
          definedOnError?.(context)
        }
      })

      return mutation as any
    }

    return {
      mutate: definedMutation,
      useMutation: definedUseMutation,
    }
  }

  return {
    query,
    useQuery,
    defineQuery,
    setQueryData,
    refreshQueryData,
    mutate,
    useMutation,
    defineMutation,
  }
}