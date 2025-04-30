import { isArray } from "./utilities/arrays";
import { QueryGroup, QueryGroupOptions, createQueryGroup } from "./createQueryGroup";
import { isQueryAction, Query, QueryAction, QueryOptions } from "./types/query";
import { isQueryTag, isQueryTags, QueryTag } from "./types/tags";
import { assertNever } from "./utilities/assert";
import { createIndexedCollection } from "./services/indexedCollection";
import { getActionId } from "./actionIdentifier";
import { createQueryId } from "./createSequence";
import { computed, reactive, toRefs } from "vue";
import { QueryError } from "./queryError";
import { getTags } from "./utilities/tags";

type QueryGroupId = `${number}-${string}`

type QueryData = QueryGroup<QueryAction> & { 
  queryGroupId: QueryGroupId, 
  actionId: number, 
  queries: Map<number, Query<QueryAction, QueryOptions<QueryAction>>> 
}
type TagData = QueryTag & { queryGroupId: QueryGroupId }

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
  const queries = createIndexedCollection([] as QueryData[], ['queryGroupId', 'actionId'])
  const tags = createIndexedCollection([] as TagData[], ['queryGroupId', 'key'])

  function createQueryGroupId(actionId: number, args: Parameters<QueryAction>): QueryGroupId {
    return `${actionId}-${JSON.stringify(args)}`
  }

  function getQueryGroup<
    TAction extends QueryAction,
  >(action: TAction, parameters: Parameters<TAction>): QueryData {
    const actionId = getActionId(action)
    const queryGroupId = createQueryGroupId(actionId, parameters)

    if(!queries.has('queryGroupId', queryGroupId)){
      const group = createQueryGroup(action, parameters, options)
      
      queries.addItem({...group, actionId, queryGroupId, queries: new Map()})
    }

    const [entry] = queries.getItems('queryGroupId', queryGroupId)

    return entry
  }

  const createQuery: CreateQuery = (action, parameters, options) => {
    const group = getQueryGroup(action, parameters)
    const queryId = createQueryId()

    const dispose = () => {
      group.queries.delete(queryId)
      
      if(group.queries.size === 0) {
        queries.deleteItems('queryGroupId', group.queryGroupId)
        tags.deleteItems('queryGroupId', group.queryGroupId)
      }
    }

    const data = computed(() => group.data.value ?? options?.placeholder)

    const query: Omit<Query<QueryAction, QueryOptions<QueryAction>>, 'then' | typeof Symbol.dispose> = reactive({
      data,
      executed: group.executed,
      error: group.error,
      errored: group.errored,
      executing: group.executing,
      execute: group.execute,
      dispose,
    })

    const then: Query<QueryAction, QueryOptions<QueryAction>>['then'] = (onFulfilled: any, onRejected: any) => {
      return group.promise.then((value) => {
        if(value instanceof QueryError) {
          throw value.original
        }

        return Object.assign(query, {
          [Symbol.dispose]: () => {
            dispose()
          }
        })
      }).then(onFulfilled, onRejected)
    }

    const response = reactive({
      ...toRefs(query),
      then,
      [Symbol.dispose]: () => {
        dispose()
      }
    })

    group.queries.set(queryId, response)

    // todo: tags need to be updated when group executes
    // todo: tags need to be cleared when group executes/disposes
    const queryTags = getTags(options?.tags, data.value)
    queryTags.forEach(tag => tags.addItem({...tag, queryGroupId: group.queryGroupId}))

    return response
  }

  const getQueryGroups: GetQueryGroups = (
    tagOrAction: QueryTag | QueryTag[] | QueryAction,
    parameters?:  Parameters<QueryAction>,
  ): QueryGroup[] => {
    if (isQueryTag(tagOrAction) || isQueryTags(tagOrAction)) {
      const asArray = Array.isArray(tagOrAction) ? tagOrAction : [tagOrAction]
      const results = asArray.flatMap(tag => tags.getItems('key', tag.key))

      return results.flatMap(result => queries.getItems('queryGroupId', result.queryGroupId))
    }

    if(isQueryAction(tagOrAction) && isArray(parameters)) {
      const actionId = getActionId(tagOrAction)
      const queryGroupId = createQueryGroupId(actionId, parameters)

      return queries.getItems('queryGroupId', queryGroupId)
    }

    if(isQueryAction(tagOrAction)) {
      const actionId = getActionId(tagOrAction)

      return queries.getItems('actionId', actionId)
    }

    assertNever(tagOrAction, 'Invalid arguments given to setQueryData')
  }

  return {
    createQuery,
    getQueryGroups,
  }
}