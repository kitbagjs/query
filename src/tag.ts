import { createSequence } from "./createSequence";
import { QueryTagFactory, QueryTagCallback, QueryTag, Unset, unset } from "./types/tags";

function createQueryTag(id: number, value: unknown): QueryTag {
  return {
    data: unset,
    key: `${id}-${JSON.stringify(value)}`
  }
}

const getId = createSequence()

export function tag<const TData = Unset>(): QueryTag<TData>
export function tag<const TData = Unset, TInput = unknown>(callback: QueryTagCallback<TInput>): QueryTagFactory<TData, TInput>
export function tag(callback?: QueryTagCallback): QueryTag | QueryTagFactory {
  const id = getId();

  if (callback) {
    return (value) => createQueryTag(id, callback(value))
  }

  return createQueryTag(id, undefined)
}