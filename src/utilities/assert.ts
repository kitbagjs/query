export function assertNever<T extends never>(_value: T, error: string): never {
    throw new Error(error)
}