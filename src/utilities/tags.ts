import { QueryTags } from "@/types/query"
import { QueryTag } from "@/types/tags"

export function getTags(tags: QueryTags<any> | undefined, data: unknown): QueryTag[] {
  if(!tags) {
    return []
  }

  if(typeof tags === 'function') {
    return tags(data)
  }

  return tags
}