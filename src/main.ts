import { createQueryClient } from './createQueryClient'
import { tag } from './tag'
import { QueryClient, QueryFunction, DefinedQueryFunction, QueryComposition, DefinedQueryComposition, DefinedQuery } from './types/client'
import { ClientOptions } from './types/clientOptions'
import { MutationFunction, DefinedMutationFunction, MutationData, MutationTagsContext, MutationOptions, Mutation, DefinedMutation, DefinedMutationComposition, AwaitedMutation } from './types/mutation'
import { QueryOptions, Query, AwaitedQuery } from './types/query'
import { QueryTag, QueryTagType } from './types/tags'

const { query, useQuery } = createQueryClient()

export {
  query,
  useQuery,
  createQueryClient,
  tag
}

export type {
  QueryClient,
  QueryFunction,
  QueryComposition,
  DefinedQueryFunction,
  DefinedQueryComposition,
  DefinedQuery,
  ClientOptions,
  MutationFunction,
  DefinedMutationFunction,
  MutationData,
  MutationTagsContext,
  MutationOptions,
  Mutation,
  DefinedMutation,
  DefinedMutationComposition,
  AwaitedMutation,
  QueryOptions,
  Query,
  AwaitedQuery,
  QueryTag,
  QueryTagType
}
