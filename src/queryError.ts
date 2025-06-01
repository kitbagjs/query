export class QueryError extends Error {
  public original: unknown

  public constructor(original: unknown) {
    super()

    this.original = original
  }
}
