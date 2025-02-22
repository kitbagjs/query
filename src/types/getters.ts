export type MaybeGetter<T> = T | Getter<T>
export type Getter<T> = () => T