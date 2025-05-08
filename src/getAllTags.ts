import { MutationTags } from "./types/mutation"
import { QueryTags } from "./types/query"
import { QueryTag } from "./types/tags"

export function getAllTags<
  TTags extends QueryTags | MutationTags | undefined,
>(tags: TTags, data: unknown): QueryTag[] {
  if(typeof tags === 'function') {
    return tags(data)
  }

  return tags ?? []
}