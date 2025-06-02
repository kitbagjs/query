export type DefaultValue<TValue, TDefault> = unknown extends TValue ? TDefault : TValue
