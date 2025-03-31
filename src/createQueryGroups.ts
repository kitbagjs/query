import { QueryGroup, QueryGroupOptions, createQueryGroup } from "./createQueryGroup";
import { createSequence } from "./createSequence";
import { Query, QueryAction, QueryOptions } from "./types/query";

type QueryGroupKey = `${number}-${string}`

export type CreateQuery = <
  const TAction extends QueryAction,
  const TOptions extends QueryOptions<TAction>
>(action: TAction, parameters: Parameters<TAction>, options?: TOptions) => Query<TAction, TOptions>

export type CreateQueryGroups = {
  createQuery: CreateQuery
}

export function createQueryGroups(options?: QueryGroupOptions) {
  const createActionId = createSequence()
  const actions = new Map<QueryAction, number>()
  const groups = new Map<QueryGroupKey, QueryGroup>()

  function createGroupKey(action: QueryAction, args: Parameters<QueryAction>): QueryGroupKey {
    if (!actions.has(action)) {
      actions.set(action, createActionId())
    }

    const actionValue = actions.get(action)!

    return `${actionValue}-${JSON.stringify(args)}`
  }

  function getQueryGroup<
    TAction extends QueryAction,
  >(action: TAction, parameters: Parameters<TAction>): QueryGroup<TAction> {
    const queryKey = createGroupKey(action, parameters)

    if(!groups.has(queryKey)) {
      const group = createQueryGroup(action, parameters, options)

      group.abortSignal.addEventListener('abort', () => {
        groups.delete(queryKey)
      })

      groups.set(queryKey, group)
    }

    return groups.get(queryKey)!
  }

  function hasQueryGroup(action: QueryAction, parameters: Parameters<QueryAction>): boolean {
    const queryKey = createGroupKey(action, parameters)

    return groups.has(queryKey)
  }

  const createQuery: CreateQuery = (action, parameters, options) => {
    const group = getQueryGroup(action, parameters)

    return group.subscribe(options)
  }

  return {
    createQuery,
    hasQueryGroup,
  }
}