export function createSequence() {
  let value = 0

  return () => value++
}

export const createQueryId = createSequence()
export const createActionId = createSequence()
export const createTagId = createSequence()