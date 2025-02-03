export function isDefined<T>(value: T | undefined): value is T {
  return typeof value !== 'undefined'
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value
}