import { QueryAction } from "./types/query";
import { createActionId } from "./createSequence";

const actions = new Map<QueryAction, number>()

export function getActionId(action: QueryAction): number {
  if(!actions.has(action)) {
    actions.set(action, createActionId())
  }

  return actions.get(action)!
}
