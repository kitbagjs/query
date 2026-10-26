export type DefaultValue<TValue, TDefault> = unknown extends TValue ? TDefault : TValue

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
