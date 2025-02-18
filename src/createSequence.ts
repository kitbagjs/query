export function createSequence() {
  let value = 0

  return () => value++
}