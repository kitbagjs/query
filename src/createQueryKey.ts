import { QueryAction } from "./types";
import { createSequence } from "./createSequence";

export type QueryKey = `${number}-${string}`

export function createGetQueryKey() {
  const actions = new Map<QueryAction, number>()
  const nextId = createSequence()

  function getActionValue(action: QueryAction): number {
    if (!actions.has(action)) {
      actions.set(action, nextId())
    }

    return actions.get(action)!
  }

  return (action: QueryAction, args: Parameters<QueryAction>): QueryKey => {
    const actionValue = getActionValue(action)

    return `${actionValue}-${JSON.stringify(args)}`
  }
}