import { getAllTags } from '@/getAllTags'
import { SetQueryData, RefreshQueryData } from '@/types/client'
import { MutationOptions, MutationTagsAfterContext, MutationTagsBeforeContext } from '@/types/mutation'
import { QueryData } from '@/types/query'

type CreateMutationOptions = {
  options: MutationOptions | undefined,
  setQueryData: SetQueryData,
  refreshQueryData: RefreshQueryData,
}

export function createMutationOptions({ options, setQueryData, refreshQueryData }: CreateMutationOptions): MutationOptions {
  const {
    setQueryDataBefore,
    setQueryDataAfter,
    onExecute,
    onSuccess,
  } = options ?? {}

  return {
    ...options,
    onExecute: (context) => {
      if (setQueryDataBefore) {
        const tags = getAllTags(options?.tags, {
          lifecycle: 'before',
          payload: context.payload,
        } satisfies MutationTagsBeforeContext)

        const setter = (queryData: QueryData): QueryData => setQueryDataBefore(queryData, context)
        for (const tag of tags) {
          setQueryData(tag, setter)
        }
      }

      onExecute?.(context)
    },
    onSuccess: (context) => {
      const tags = getAllTags(options?.tags, {
        lifecycle: 'after',
        payload: context.payload,
        data: context.data,
      } satisfies MutationTagsAfterContext)

      if (options?.refreshQueryData ?? true) {
        for (const tag of tags) {
          refreshQueryData(tag)
        }
      }

      if (setQueryDataAfter) {
        const setter = (queryData: QueryData): QueryData => setQueryDataAfter(queryData, context)
        for (const tag of tags) {
          setQueryData(tag, setter)
        }
      }

      onSuccess?.(context)
    },
  }
}
