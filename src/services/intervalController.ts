import { Getter } from "@/types/getters"
import { QueryAction } from "@/types/query"
import { Ref, ref } from "vue"

export type IntervalController = {
  execute: (action: QueryAction, getInterval: Getter<number>) => void,
  clear: () => void,
  lastExecuted: Ref<number | undefined>,
}

export function createIntervalController(): IntervalController {
  const timeout = ref<ReturnType<typeof setInterval>>()
  const lastExecuted = ref<number>()

  const execute: IntervalController['execute'] = async (action, getInterval) => {
    clear()
    
    await action()

    lastExecuted.value = Date.now()
    
    const interval = getInterval()

    if(interval !== Infinity) {
      timeout.value = setInterval(() => execute(action, getInterval), interval)
    }
  }

  const clear: IntervalController['clear'] = () => {
    clearInterval(timeout.value)
  }

  return {
    execute,
    clear,
    lastExecuted,
  }
}
