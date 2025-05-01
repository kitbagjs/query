import { createSequence } from "./createSequence";
import { QueryAction } from "./types/query";

const createActionId = createSequence()
const actions = new Map<QueryAction, number>()

export function getActionKey(action: QueryAction): number {
  if(!actions.has(action)) {
    actions.set(action, createActionId())
  }

  return actions.get(action)!
}