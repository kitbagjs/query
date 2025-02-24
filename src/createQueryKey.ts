import { createSequence } from "./createSequence";
import { QueryAction } from "./types/query";

export type ChannelKey = `${number}-${string}`

export function createGetChanelKey() {
  const actions = new Map<QueryAction, number>()
  const nextId = createSequence()

  function getActionValue(action: QueryAction): number {
    if (!actions.has(action)) {
      actions.set(action, nextId())
    }

    return actions.get(action)!
  }

  return (action: QueryAction, args: Parameters<QueryAction>): ChannelKey => {
    const actionValue = getActionValue(action)

    return `${actionValue}-${JSON.stringify(args)}`
  }
}