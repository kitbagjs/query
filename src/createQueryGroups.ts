import { QueryGroup, QueryGroupOptions, createQueryGroup } from "./createQueryGroup";
import { createSequence } from "./createSequence";
import { SetQueryData } from "./types/client";
import { isQueryTags } from "./types/tags";
import { isQueryTag } from "./types/tags";
import { QueryDataSetter } from "./types/client";
import { Query, QueryAction, QueryOptions } from "./types/query";
import { QueryTag } from "./types/tags";
import { assert } from "./utilities/assert";

type QueryGroupKey = `${number}-${string}`

export type CreateQuery = <
  const TAction extends QueryAction,
  const TOptions extends QueryOptions<TAction>
>(action: TAction, parameters: Parameters<TAction>, options?: TOptions) => Query<TAction, TOptions>

export type CreateQueryGroups = {
  createQuery: CreateQuery
  setQueryData: SetQueryData
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

  const setQueryData: SetQueryData = (
    tagOrAction: QueryTag | QueryTag[] | QueryAction,
    parametersOrSetter: QueryDataSetter | Parameters<QueryAction>,
    maybeSetter?: QueryDataSetter
  ) => {
    if (isQueryTag(tagOrAction) || isQueryTags(tagOrAction)) {
      return setQueryDataByTag(tagOrAction, parametersOrSetter as QueryDataSetter)
    }

    if (typeof tagOrAction === 'function') {
      if (typeof parametersOrSetter === 'function') {
        return setQueryDataByAction(tagOrAction, parametersOrSetter as QueryDataSetter)
      }

      return setQueryDataByActionAndParameters(tagOrAction, parametersOrSetter as Parameters<QueryAction>, maybeSetter as QueryDataSetter)
    }

    assert(tagOrAction, 'Invalid arguments given to setQueryData')
  }


  function setQueryDataByTag(tag: QueryTag | QueryTag[], setter: QueryDataSetter) {
    for (const group of groups.values()) {
      if (group.hasTag(tag)) {
        group.setQueryData(setter)
      }
    }
  }

  function setQueryDataByAction(action: QueryAction, setter: QueryDataSetter) {
    const keys = actionGroups.get(getActionKey(action))

    if(!keys) {
      return
    }

    for(const key of keys) {
      const group = groups.get(key)

      if(!group) {
        continue
      }

      group.setQueryData(setter)
    }
  }

  function setQueryDataByActionAndParameters(action: QueryAction, parameters: Parameters<QueryAction>, setter: QueryDataSetter) {
    const key = getQueryGroupKey(getActionKey(action), parameters)
    const group = groups.get(key)

    if(!group) {
      return
    }

    group.setQueryData(setter)
  }

  return {
    createQuery,
    setQueryData,
  }
}