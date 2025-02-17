export function sequence() {
  let previous = 0

  return {
    next: () => previous += 1
  }
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}