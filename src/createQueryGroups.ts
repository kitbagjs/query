import { isArray } from './utilities/arrays'
import { QueryGroup, QueryGroupOptions, createQueryGroup } from './createQueryGroup'
import { isQueryAction, Query, QueryAction, QueryOptions } from './types/query'
import { isQueryTag, isQueryTags, QueryTag } from './types/tags'
import { assertNever } from './utilities/assert'
import { getQueryGroupKey } from './getQueryGroupKey'
import { getActionKey } from './getActionKey'

type QueryGroupKey = `${number}-${string}`

export type CreateQuery = <
  const TAction extends QueryAction,
  const TPlaceholder
>(action: TAction, parameters: Parameters<TAction>, options?: QueryOptions<TAction, TPlaceholder>) => Query<TAction, TPlaceholder>

export type GetQueryGroups = {
  <TQueryTag extends QueryTag>(tags: TQueryTag | TQueryTag[]): QueryGroup[],
  <TAction extends QueryAction>(action: TAction, parameters?: Parameters<TAction>): QueryGroup[],
}

export type CreateQueryGroups = {
  createQuery: CreateQuery,
  getQueryGroups: GetQueryGroups,
}

export function createQueryGroups(options?: QueryGroupOptions) {
  const actionGroups = new Map<number, Set<QueryGroupKey>>()
  const groups = new Map<QueryGroupKey, QueryGroup>()

  function getQueryGroup<
    TAction extends QueryAction
  >(action: TAction, parameters: Parameters<TAction>): QueryGroup<TAction> {
    const actionKey = getActionKey(action)
    const groupKey = getQueryGroupKey(action, parameters)

    if (!actionGroups.has(actionKey)) {
      actionGroups.set(actionKey, new Set())
    }

    actionGroups.get(actionKey)!.add(groupKey)

    if (!groups.has(groupKey)) {
      const onDispose = () => {
        groups.delete(groupKey)
      }

      const group = createQueryGroup(action, parameters, { ...options, onDispose })

      groups.set(groupKey, group)
    }

    return groups.get(groupKey)!
  }

  const createQuery: CreateQuery = (action, parameters, options) => {
    const group = getQueryGroup(action, parameters)

    return group.createQuery(options)
  }

  const getQueryGroups: GetQueryGroups = (
    tagOrAction: QueryTag | QueryTag[] | QueryAction,
    parameters?: Parameters<QueryAction>,
  ): QueryGroup[] => {
    if (isQueryTag(tagOrAction) || isQueryTags(tagOrAction)) {
      return Array.from(groups.values()).filter((group) => group.hasTag(tagOrAction))
    }

    if (isQueryAction(tagOrAction) && isArray(parameters)) {
      const groupKey = getQueryGroupKey(tagOrAction, parameters)
      const group = groups.get(groupKey)

      return group ? [group] : []
    }

    if (isQueryAction(tagOrAction)) {
      const actionKey = getActionKey(tagOrAction)
      const groupKeys = actionGroups.get(actionKey)

      return groupKeys ? Array.from(groupKeys).map((key) => groups.get(key)!) : []
    }

    assertNever(tagOrAction, 'Invalid arguments given to setQueryData')
  }

  return {
    createQuery,
    getQueryGroups,
  }
}
