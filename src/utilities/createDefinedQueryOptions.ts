import { getAllTags } from '@/getAllTags'
import { QueryOptions } from '@/types/query'

type CreateDefinedQueryOptions = {
  options: QueryOptions | undefined,
  definedOptions: QueryOptions | undefined,
}

export function createDefinedQueryOptions({ options, definedOptions }: CreateDefinedQueryOptions): QueryOptions {
  return {
    placeholder: options?.placeholder ?? definedOptions?.placeholder,
    interval: options?.interval ?? definedOptions?.interval,
    retries: options?.retries ?? definedOptions?.retries,
    tags: (data) => {
      const definedTags = getAllTags(definedOptions?.tags, data)
      const tags = getAllTags(options?.tags, data)

      return [...definedTags, ...tags]
    },
    onSuccess: (context) => {
      options?.onSuccess?.(context)
      definedOptions?.onSuccess?.(context)
    },
    onError: (context) => {
      options?.onError?.(context)
      definedOptions?.onError?.(context)
    },
  }
}
