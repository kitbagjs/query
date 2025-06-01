import { isQueryAction, QueryAction, QueryOptions } from './types/query'
import { ClientOptions } from './types/clientOptions'
import {
  DefinedQueryComposition,
  DefinedQueryFunction,
  DefineQuery,
  QueryClient,
  QueryComposition,
  QueryDataSetter,
  QueryFunction,
  RefreshQueryData,
  SetQueryData
} from './types/client'
import { createQueryGroups } from './createQueryGroups'
import { createUseQuery } from './createUseQuery'
import { isQueryTag, isQueryTags, QueryTag } from './types/tags'
import { isArray } from './utilities/arrays'
import { assertNever } from './utilities/assert'
import { QueryGroup } from './createQueryGroup'
import { MutationComposition, MutationFunction, DefineMutation, DefinedMutationFunction, MutationAction, MutationTags, MutationOptions, DefinedMutationComposition } from './types/mutation'
import { createMutation } from './createMutation'
import { createDefinedQueryOptions } from './utilities/createDefinedQueryOptions'
import { createDefinedMutationOptions } from './utilities/createDefinedMutationOptions'
import { createMutationOptions } from './utilities/createMutationOptions'

export function createQueryClient(options?: ClientOptions): QueryClient {
  const { createQuery, getQueryGroups } = createQueryGroups(options)

  const query: QueryFunction = (action, args, options) => {
    return createQuery(action, args, options)
  }

  const useQuery: QueryComposition = (action, parameters, options) => {
    return createUseQuery(createQuery, action, parameters, options)
  }

  const defineQuery: DefineQuery = <
    TDefinedAction extends QueryAction,
    TDefinedPlaceholder
  >(action: TDefinedAction, definedOptions?: QueryOptions<TDefinedAction, TDefinedPlaceholder>) => {
    const definedQuery: DefinedQueryFunction<TDefinedAction, TDefinedPlaceholder> = (args, options) => {
      return query(action, args, createDefinedQueryOptions({
        options,
        definedOptions,
      }))
    }

    const definedUseQuery: DefinedQueryComposition<TDefinedAction, TDefinedPlaceholder> = (args, options) => {
      return useQuery(action, args, createDefinedQueryOptions({
        options,
        definedOptions,
      }))
    }

    return {
      query: definedQuery,
      useQuery: definedUseQuery,
    }
  }

  const setQueryData: SetQueryData = (
    param1: QueryTag | QueryTag[] | QueryAction,
    param2: Parameters<QueryAction> | QueryDataSetter,
    param3?: QueryDataSetter,
  ): void => {
    const setDataForGroups = (groups: QueryGroup[], setter: QueryDataSetter): void => {
      groups.forEach((group) => {
        const data = group.getData()
        const newData = setter(data)

        group.setData(newData)
      })
    }

    if (isQueryTag(param1) || isQueryTags(param1)) {
      const tags = param1
      const setter = param2 as QueryDataSetter
      const groups = getQueryGroups(tags)

      setDataForGroups(groups, setter)

      return
    }

    if (isQueryAction(param1) && isArray(param2)) {
      const action = param1
      const parameters = param2
      const setter = param3!
      const groups = getQueryGroups(action, parameters)

      setDataForGroups(groups, setter)

      return
    }

    if (isQueryAction(param1)) {
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
    if (isQueryTag(param1) || isQueryTags(param1)) {
      const tags = param1
      const groups = getQueryGroups(tags)

      groups.forEach((group) => {
        group.execute()
      })

      return
    }

    if (isQueryAction(param1)) {
      const action = param1
      const parameters = param2
      const groups = getQueryGroups(action, parameters)

      groups.forEach((group) => {
        group.execute()
      })

      return
    }

    assertNever(param1, 'Invalid arguments given to setQueryData')
  }

  const mutate: MutationFunction = (action, parameters, options) => {
    const mutation = createMutation(action, createMutationOptions({
      options,
      setQueryData,
      refreshQueryData,
    }))

    mutation.mutate(...parameters).catch(() => {
      // silence here for now
      // later we'll want to automatically revert the `setQueryDataBefore`
    })

    return mutation
  }

  const useMutation: MutationComposition = (action, options) => {
    return createMutation(action, createMutationOptions({
      options,
      setQueryData,
      refreshQueryData,
    }))
  }

  const defineMutation: DefineMutation = <
    TDefinedAction extends MutationAction,
    TDefinedPlaceholder,
    TDefinedTags extends MutationTags<TDefinedAction>
  >(action: TDefinedAction, definedOptions?: MutationOptions<TDefinedAction, TDefinedPlaceholder, TDefinedTags>) => {
    const definedMutation: DefinedMutationFunction<TDefinedAction, TDefinedPlaceholder> = (parameters, options) => {
      const combinedOptions = createDefinedMutationOptions({
        options,
        definedOptions,
        setQueryData,
        refreshQueryData,
      })

      const mutation = createMutation(action, combinedOptions)

      mutation.mutate(...parameters).catch(() => {
        // silence here for now
        // later we'll want to automatically revert the `setQueryDataBefore`
      })

      return mutation
    }

    const definedUseMutation: DefinedMutationComposition<TDefinedAction, TDefinedPlaceholder> = (options) => {
      const combinedOptions = createDefinedMutationOptions({
        options,
        definedOptions,
        setQueryData,
        refreshQueryData,
      })

      return createMutation(action, combinedOptions)
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
