import { Getter } from "@/types/getters"
import { QueryAction } from "@/types/query"

export type IntervalController = {
  set: (action: QueryAction, getInterval: Getter<number>) => void,
  clear: () => void,
}

export function createIntervalController(): IntervalController {
  let timeout: ReturnType<typeof setInterval> | undefined

  const clear: IntervalController['clear'] = () => {
    if(timeout) {
      clearInterval(timeout)
    }
  }

  const set: IntervalController['set'] = async (action, getInterval) => {
    clear()
    
    const interval = getInterval()

    if(interval !== Infinity) {
      timeout = setInterval(action, interval)
    }
  }

  return {
    set,
    clear,
  }
}
