import { getAllTags } from "@/getAllTags";
import { SetQueryData, RefreshQueryData } from "@/types/client";
import { MutationOptions } from "@/types/mutation";
import { QueryData } from "@/types/query";

type CreateDefinedMutationOptions = {
  options: MutationOptions | undefined,
  definedOptions: MutationOptions | undefined,
  setQueryData: SetQueryData
  refreshQueryData: RefreshQueryData
}

export function createDefinedMutationOptions({ 
  options,
  definedOptions, 
  setQueryData,
  refreshQueryData
}: CreateDefinedMutationOptions): MutationOptions {
  const { 
    setQueryDataBefore: definedSetQueryDataBefore, 
    setQueryDataAfter: definedSetQueryDataAfter, 
    onExecute: definedOnExecute, 
    onSuccess: definedOnSuccess,
    onError: definedOnError
  } = definedOptions ?? {}

  const { 
    setQueryDataBefore, 
    setQueryDataAfter, 
    onExecute, 
    onSuccess,
    onError
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
      if(setQueryDataBefore) {
        const tags = getAllTags(options?.tags, undefined)
        const setter = (data: QueryData) => setQueryDataBefore(data, context)
        
        setQueryData(tags, setter)
      }
      
      if(definedSetQueryDataBefore) {
        const tags = getAllTags(definedOptions?.tags, undefined)
        const setter = (data: QueryData) => definedSetQueryDataBefore(data, context)
        
        setQueryData(tags, setter)
      }

      onExecute?.(context)
      definedOnExecute?.(context)
    },
    onSuccess: (context) => {
      const shouldRefreshQueryData = options?.refreshQueryData ?? definedOptions?.refreshQueryData ?? true
      const tags = getAllTags(options?.tags, context.data)
      const definedTags = getAllTags(definedOptions?.tags, context.data)

      if(shouldRefreshQueryData) {
        refreshQueryData(tags)
        refreshQueryData(definedTags)
      }

      if(setQueryDataAfter) {
        setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataAfter(queryData, context))
      }

      if(definedSetQueryDataAfter) {
        setQueryData(definedTags, (queryData: QueryData): QueryData => definedSetQueryDataAfter(queryData, context))
      }

      onSuccess?.(context)
      definedOnSuccess?.(context)
    },
    onError: (context) => {
      onError?.(context)
      definedOnError?.(context)
    }
  }
}