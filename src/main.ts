import { createQueryClient } from './createQueryClient'
import { tag } from './tag'

import { QueryClient, QueryFunction, DefinedQueryFunction, UseQueryOptions, QueryComposition, DefinedQueryComposition, DefineQuery, DefinedQuery, QueryDataSetter, SetQueryData, RefreshQueryData } from './types/client'
import { ClientOptions } from './types/clientOptions'
import { MutationAction, MutationData, MutationTagsContext, MutationTagsBeforeContext, MutationTagsAfterContext, MutationTags, MutationTagsType, OnExecuteContext, OnSuccessContext, SetQueryDataBeforeContext, SetQueryDataAfterContext, OnErrorContext, MutationOptions, Mutation, AwaitedMutation, MutationFunction, DefinedMutationFunction, MutationComposition, DefinedMutationComposition, DefinedMutation, DefineMutation } from './types/mutation'
import { QueryAction, QueryData, QueryActionArgs, QueryTags, QueryOptions, Query, AwaitedQuery } from './types/query'
import { QueryTag, QueryTagType, QueryTagCallback, QueryTagFactory } from './types/tags'

const { query, useQuery } = createQueryClient()

export {
  createQueryClient,
  tag,
  query, useQuery
}

export type {
  QueryClient, QueryFunction, DefinedQueryFunction, UseQueryOptions, QueryComposition, DefinedQueryComposition, DefineQuery, DefinedQuery, QueryDataSetter, SetQueryData, RefreshQueryData,
  ClientOptions,
  MutationAction, MutationData, MutationTagsContext, MutationTagsBeforeContext, MutationTagsAfterContext, MutationTags, MutationTagsType, OnExecuteContext, OnSuccessContext, SetQueryDataBeforeContext, SetQueryDataAfterContext, OnErrorContext, MutationOptions, Mutation, AwaitedMutation, MutationFunction, DefinedMutationFunction, MutationComposition, DefinedMutationComposition, DefinedMutation, DefineMutation,
  QueryAction, QueryData, QueryActionArgs, QueryTags, QueryOptions, Query, AwaitedQuery,
  QueryTag, QueryTagType, QueryTagCallback, QueryTagFactory
}
