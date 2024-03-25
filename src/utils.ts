export function sequence() {
  let previous = 0

  return {
    next: () => previous += 1
  }
}