import { QueryAction } from '@/types/query'

export type IntervalController = {
  set: (action: QueryAction, interval: number) => void,
  clear: () => void,
}

export function createIntervalController(): IntervalController {
  let timeout: ReturnType<typeof setTimeout> | undefined

  const clear: IntervalController['clear'] = () => {
    if (timeout) {
      clearInterval(timeout)
    }
  }

  const set: IntervalController['set'] = (action, interval) => {
    clear()

    if (interval !== Infinity) {
      timeout = setTimeout(action, interval)
    }
  }

  return {
    set,
    clear,
  }
}
