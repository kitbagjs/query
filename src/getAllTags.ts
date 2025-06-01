import { MutationTags } from './types/mutation'
import { QueryTags } from './types/query'
import { QueryTag } from './types/tags'

export function getAllTags(tags: QueryTags | MutationTags | undefined, data: any): QueryTag[] {
  if (typeof tags === 'function') {
    return tags(data)
  }

  return tags ?? []
}
