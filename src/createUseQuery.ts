import { CreateQuery } from './createQueryGroups'
import { Query, QueryAction, QueryActionArgs } from './types/query'
import { onScopeDispose, ref, toRef, toRefs, toValue, watch } from 'vue'
import equal from "fast-deep-equal"
import { isDefined } from './utilities'
import { UseQueryOptions } from './types/client'

const noop = () => undefined

export function createUseQuery<
  TAction extends QueryAction,
  TPlaceholder
>(createQuery: CreateQuery, action: TAction, parameters: QueryActionArgs<TAction>, options?: UseQueryOptions<TAction, TPlaceholder>): Query<TAction, TPlaceholder>

export function createUseQuery(createQuery: CreateQuery, action: QueryAction, parameters: QueryActionArgs<QueryAction>, options: UseQueryOptions = {}): Query<QueryAction, unknown> {
  const query = createQuery(noop, [], options)
  const enabled = ref(options.immediate ?? true)
  const { promise, resolve, reject } = Promise.withResolvers()

  function enable() {
    enabled.value = true
  }

  watch(() => ({ enabled: enabled.value, parameters: toValue(parameters) }) as const, ({ enabled, parameters }, previous) => {
    const isSameParameters = previous && isDefined(previous.parameters) && equal(previous.parameters, parameters)
    const isSameEnabled = previous && previous.enabled === enabled

    if (isSameParameters && isSameEnabled) {
      return
    }

    query.dispose()

    if (parameters === null) {
      Object.assign(query, {
        data: toRef(() => options.placeholder),
        executed: toRef(() => false),
        executing: false,
      })

      return
    }

    if (!enabled) {
      Object.assign(query, {
        executed: toRef(() => false),
        executing: false,
        execute: () => {
          enable()

          return promise
        },
      })

      return
    }

    const newValue = createQuery(action, parameters, {
      ...options,
      onSuccess: (response) => {
        if (previous?.enabled === false) {
          resolve(response)
        }

        options.onSuccess?.(response)
      },
      onError: (error) => {
        if (previous?.enabled === false) {
          reject(error)
        }

        options.onError?.(error)
      },
    })

    const previousData = query.data

    Object.assign(query, toRefs(newValue), {
      data: toRef(() => newValue.data ?? previousData),
    })
  }, { deep: true, immediate: true })

  onScopeDispose(() => {
    query.dispose()
  })

  return query
}
