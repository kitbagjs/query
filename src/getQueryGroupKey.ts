import { getActionKey } from './getActionKey'
import { QueryAction } from './types/query'

export type QueryGroupKey = `${number}-${string}`

export function getQueryGroupKey<TAction extends QueryAction>(action: TAction, args: Parameters<TAction>): QueryGroupKey {
  return `${getActionKey(action)}-${JSON.stringify(args)}`
}
