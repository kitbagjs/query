import { describe, test } from "vitest"
import { createQueryClient } from "./createQueryClient"
import { tag } from "./tag"

describe('options', () => {
  test('tags', async () => {
    const action = () => 'response'
    const { query } = createQueryClient()
    const numberTag = tag<number>()
    const stringTag = tag<string>()
    const untypedTag = tag()

    // @ts-expect-error
    query(action, [], { tags: [numberTag, stringTag] })

    // @ts-expect-error
    query(action, [], { tags: () => [numberTag, stringTag] })

    query(action, [], { tags: [stringTag, untypedTag] })
    query(action, [], { tags: () => [stringTag, untypedTag] })

    query(action, [], { tags: [untypedTag] })
    query(action, [], { tags: () => [untypedTag] })
  })
})