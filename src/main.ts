import { createClient } from './createClient'

const { query, useQuery } = createClient()

export {
  query,
  useQuery,
  createClient,
}