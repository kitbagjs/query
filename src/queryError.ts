export class QueryError extends Error {
  constructor(public original: unknown) {
    super()
  }
}

