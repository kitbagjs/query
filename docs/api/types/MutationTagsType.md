# Types: MutationTagsType\<TTags\>

```ts
type MutationTagsType<TTags> = TTags extends QueryTag[] ? QueryTagType<TTags[number]> : TTags extends (value) => QueryTag[] ? QueryTagType<ReturnType<TTags>[number]> : never;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TTags` *extends* [`MutationTags`](MutationTags.md) |
