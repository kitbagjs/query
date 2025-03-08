import { createClient } from './createClient'
import { tag } from './tag'

const { query, useQuery } = createClient()

export {
  query,
  useQuery,
  createClient,
  tag,
}