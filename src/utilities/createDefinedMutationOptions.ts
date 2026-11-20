import { getAllTags } from '@/getAllTags'
import { SetQueryData, RefreshQueryData } from '@/types/client'
import { MutationOptions } from '@/types/mutation'
import { QueryData } from '@/types/query'

type CreateDefinedMutationOptions = {
  options: MutationOptions | undefined,
  definedOptions: MutationOptions | undefined,
  setQueryData: SetQueryData,
  refreshQueryData: RefreshQueryData,
}

export function createDefinedMutationOptions({
  options,
  definedOptions,
  setQueryData,
  refreshQueryData,
}: CreateDefinedMutationOptions): MutationOptions {
  const {
    setQueryDataBefore: definedSetQueryDataBefore,
    setQueryDataAfter: definedSetQueryDataAfter,
    onExecute: definedOnExecute,
    onSuccess: definedOnSuccess,
    onError: definedOnError,
  } = definedOptions ?? {}

  const {
    setQueryDataBefore,
    setQueryDataAfter,
    onExecute,
    onSuccess,
    onError,
  } = options ?? {}

  return {
    placeholder: options?.placeholder ?? definedOptions?.placeholder,
    retries: options?.retries ?? definedOptions?.retries,
    refreshQueryData: options?.refreshQueryData ?? definedOptions?.refreshQueryData,
    tags: (data) => {
      const definedTags = getAllTags(definedOptions?.tags, data)
      const tags = getAllTags(options?.tags, data)

      return [...definedTags, ...tags]
    },
    onExecute: (context) => {
      if (setQueryDataBefore) {
        const tags = getAllTags(options?.tags, undefined)
        const setter = (data: QueryData) => setQueryDataBefore(data, context)

        for (const tag of tags) {
          setQueryData(tag, setter)
        }
      }

      if (definedSetQueryDataBefore) {
        const tags = getAllTags(definedOptions?.tags, undefined)
        const setter = (data: QueryData) => definedSetQueryDataBefore(data, context)

        for (const tag of tags) {
          setQueryData(tag, setter)
        }
      }

      onExecute?.(context)
      definedOnExecute?.(context)
    },
    onSuccess: (context) => {
      const shouldRefreshQueryData = options?.refreshQueryData ?? definedOptions?.refreshQueryData ?? true
      const tags = getAllTags(options?.tags, context.data)
      const definedTags = getAllTags(definedOptions?.tags, context.data)

      if (shouldRefreshQueryData) {
        for (const tag of tags) {
          refreshQueryData(tag)
        }
        for (const tag of definedTags) {
          refreshQueryData(tag)
        }
      }

      if (setQueryDataAfter) {
        const setter = (queryData: QueryData): QueryData => setQueryDataAfter(queryData, context)
        for (const tag of tags) {
          setQueryData(tag, setter)
        }
      }

      if (definedSetQueryDataAfter) {
        const setter = (queryData: QueryData): QueryData => definedSetQueryDataAfter(queryData, context)
        for (const tag of definedTags) {
          setQueryData(tag, setter)
        }
      }

      onSuccess?.(context)
      definedOnSuccess?.(context)
    },
    onError: (context) => {
      onError?.(context)
      definedOnError?.(context)
    },
  }
}
