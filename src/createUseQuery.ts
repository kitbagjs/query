import { CreateQuery } from "./createQueryGroups"
import { Query, QueryAction, QueryActionArgs, QueryOptions } from "./types/query"
import { onScopeDispose, toRef, toRefs, toValue, watch } from "vue"
import isEqual from 'lodash.isequal'
import { isDefined } from "./utilities"

const noop = () => undefined

export function createUseQuery<
  TAction extends QueryAction,
  TArgs extends QueryActionArgs<TAction>,
  TOptions extends QueryOptions<TAction>
>(createQuery: CreateQuery, action: TAction, parameters: TArgs, options?: TOptions): Query<TAction, TOptions>
export function createUseQuery(createQuery: CreateQuery, action: QueryAction, parameters: unknown[], options: QueryOptions<QueryAction>): Query<QueryAction, QueryOptions<QueryAction>> {
  const query = createQuery(noop, [], options)

  watch(() => toValue(parameters), (parameters, previousParameters) => {
    if(isDefined(previousParameters) && isEqual(previousParameters, parameters)) {
      return
    }

    query.dispose()

    if(parameters === null) {
      Object.assign(query, {
        data: toRef(() => options?.placeholder),
        executed: toRef(() => false),
        executing: false,
      })

      return
    }

    const newValue = createQuery(action, parameters, options)
    const previousData = query.data

    Object.assign(query, toRefs(newValue), {
      data: toRef(() => newValue.data ?? previousData)
    })
        
  }, { deep: true, immediate: true })

  onScopeDispose(() => query.dispose())

  return query
}