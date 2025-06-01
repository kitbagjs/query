export function assertNever(_value: never, error: string): never {
  throw new Error(error)
}
