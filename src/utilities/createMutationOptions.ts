import { getAllTags } from "@/getAllTags"
import { SetQueryData } from "@/types/client"
import { RefreshQueryData } from "@/types/client"
import { MutationOptions } from "@/types/mutation"
import { QueryData } from "@/types/query"

type CreateMutationOptions = {
  options: MutationOptions | undefined,
  setQueryData: SetQueryData
  refreshQueryData: RefreshQueryData
}

export function createMutationOptions({ options, setQueryData, refreshQueryData }: CreateMutationOptions): MutationOptions {
  const { 
    setQueryDataBefore,
    setQueryDataAfter,
    onExecute, 
    onSuccess 
  } = options ?? {}
  
  return {
    ...options,
    onExecute: (context) => {
      if(setQueryDataBefore) {
        const tags = getAllTags(options?.tags, undefined)

        setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataBefore(queryData, context))
      }

      onExecute?.(context)
    },
    onSuccess: (context) => {
      const tags = getAllTags(options?.tags, context.data)

      if(options?.refreshQueryData ?? true) {
        refreshQueryData(tags)
      }

      if(setQueryDataAfter) {
        setQueryData(tags, (queryData: QueryData): QueryData => setQueryDataAfter(queryData, context))
      }

      onSuccess?.(context)
    },
  }
}