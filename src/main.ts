import { createQueryClient } from './createQueryClient'
import { tag } from './tag'

const { query, useQuery } = createQueryClient()

export {
  query,
  useQuery,
  createQueryClient,
  tag,
}