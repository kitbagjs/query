/// <reference types="vite/client" />
const enabled: boolean = !import.meta.env.VITEST

export function log(...data: any[]): void {
  if (!enabled) {
    return
  }

  console.log(data)
}
