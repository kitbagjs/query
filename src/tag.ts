import { createSequence } from "./createSequence";
import { QueryTagFactory, QueryTagCallback, QueryTag } from "./types/tags";

function createQueryTag(id: number, name: string, value: unknown): QueryTag {
  return {
    id,
    name,
    value,
    key: `${id}-${name}-${JSON.stringify(value)}`
  }
}

const getId = createSequence()

export function tag<const TName extends string>(name: TName): QueryTag<TName>
export function tag<const TName extends string, TInput>(name: TName, callback: QueryTagCallback<TInput>): QueryTagFactory<TName, TInput>
export function tag(name: string, callback?: QueryTagCallback): QueryTag | QueryTagFactory {
  const id = getId();

  if (callback) {
    return (value) => createQueryTag(id, name, callback(value))
  }

  return createQueryTag(id, name, undefined)
}