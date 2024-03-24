import { createQuery } from './createQuery'

const { query, useQuery } = createQuery()

export {
  query,
  useQuery,
  createQuery,
}

export * from './types'