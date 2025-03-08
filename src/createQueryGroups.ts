import { QueryGroup, createQueryGroup } from "./createQueryGroup";
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

export function createQueryGroups() {
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
      groups.set(queryKey, createQueryGroup(action, parameters))
    }

    return groups.get(queryKey)!
  }

  const createQuery: CreateQuery = (action, parameters, options) => {
    const group = getQueryGroup(action, parameters)

    return group.subscribe(options)
  }

  return {
    createQuery,
  }
}