import { timeout } from "./timeout"

type RetryCallback<T> = () => T

export type RetryOptions = {
  count: number,
  delay: number,
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  count: 0,
  delay: 500,
}

function normalizeRetryOptions(options: Partial<RetryOptions> | number | undefined): RetryOptions {
  if(typeof options === 'number') {
     return normalizeRetryOptions({count: options})
  }

  if(typeof options === 'object') {
    return {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    }
  }

  return DEFAULT_RETRY_OPTIONS
}

export function reduceRetryOptions(options: (Partial<RetryOptions> | number | undefined)[]): RetryOptions {
  return options.reduce<RetryOptions>((response, options) => {
    const { count: retries, delay } = normalizeRetryOptions(options)

    return {
      count: Math.max(retries, response.count),
      delay: Math.min(delay, response.delay),
    }
  }, DEFAULT_RETRY_OPTIONS)
}

export async function retry<T>(action: RetryCallback<T>, options: RetryOptions, count: number = 0): Promise<T> {
  const { count: retries, delay } = options

  try {
    return await action()
  } catch(error) {
    if(count >= retries) {
      throw error
    }

    await timeout(delay)

    return retry(action, options, count + 1)
  }
}