import { isArray } from "./utilities/arrays";
import { QueryGroup, QueryGroupOptions, createQueryGroup } from "./createQueryGroup";
import { createSequence } from "./createSequence";
import { isQueryAction, Query, QueryAction, QueryOptions } from "./types/query";
import { isQueryTag, isQueryTags, QueryTag } from "./types/tags";
import { assertNever } from "./utilities/assert";

type QueryGroupKey = `${number}-${string}`

export type CreateQuery = <
  const TAction extends QueryAction,
  const TOptions extends QueryOptions<TAction>
>(action: TAction, parameters: Parameters<TAction>, options?: TOptions) => Query<TAction, TOptions>

export type GetQueryGroups = {
  <TQueryTag extends QueryTag>(tag: TQueryTag): QueryGroup[]
  <TQueryTag extends QueryTag>(tags: TQueryTag[]): QueryGroup[]
  <TAction extends QueryAction>(action: TAction): QueryGroup[]
  <TAction extends QueryAction>(action: TAction, parameters: Parameters<TAction>): QueryGroup[]
}

export type CreateQueryGroups = {
  createQuery: CreateQuery
  getQueryGroups: GetQueryGroups
}

export function createQueryGroups(options?: QueryGroupOptions) {
  const createActionId = createSequence()
  const actions = new Map<QueryAction, number>()
  const actionGroups = new Map<number, Set<QueryGroupKey>>()
  const groups = new Map<QueryGroupKey, QueryGroup>()

  function getActionKey(action: QueryAction): number {
    if(!actions.has(action)) {
      actions.set(action, createActionId())
    }

    return actions.get(action)!
  }

  function getQueryGroupKey(actionKey: number, args: Parameters<QueryAction>): QueryGroupKey {
    return `${actionKey}-${JSON.stringify(args)}`
  }

  function getQueryGroup<
    TAction extends QueryAction,
  >(action: TAction, parameters: Parameters<TAction>): QueryGroup<TAction> {
    const actionKey = getActionKey(action)
    const groupKey = getQueryGroupKey(actionKey, parameters)

    if(!actionGroups.has(actionKey)) {
      actionGroups.set(actionKey, new Set())
    }

    actionGroups.get(actionKey)!.add(groupKey)

    if(!groups.has(groupKey)) {
      groups.set(groupKey, createQueryGroup(action, parameters, options))
    }

    return groups.get(groupKey)!
  }

  const createQuery: CreateQuery = (action, parameters, options) => {
    const group = getQueryGroup(action, parameters)

    return group.subscribe(options)
  }

  const getQueryGroups: GetQueryGroups = (
    tagOrAction: QueryTag | QueryTag[] | QueryAction,
    parameters?:  Parameters<QueryAction>,
  ): QueryGroup[] => {
    if (isQueryTag(tagOrAction) || isQueryTags(tagOrAction)) {
      return Array.from(groups.values()).filter(group => group.hasTag(tagOrAction))
    }

    if(isQueryAction(tagOrAction) && isArray(parameters)) {
      const actionKey = getActionKey(tagOrAction)
      const groupKey = getQueryGroupKey(actionKey, parameters)
      const group = groups.get(groupKey)

      return group ? [group] : []
    }

    if(isQueryAction(tagOrAction)) {
      const actionKey = getActionKey(tagOrAction)
      const groupKeys = actionGroups.get(actionKey)

      return groupKeys ? Array.from(groupKeys).map(key => groups.get(key)!) : []
    }

    assertNever(tagOrAction, 'Invalid arguments given to setQueryData')
  }

  return {
    createQuery,
    getQueryGroups,
  }
}