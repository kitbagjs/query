export function isDefined<T>(value: T | undefined): value is T {
  return typeof value !== 'undefined'
}

export function timeout(ms?: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}