import { timeout } from "./timeout"

type RetryCallback<T> = () => T

type RetryOptions = {
  retries?: number,
  delay?: number,
}

const DEFAULT_RETRIES = 0
const DEFAULT_DELAY = 1000

export async function retry<T>(action: RetryCallback<T>, options: RetryOptions = {}, count: number = 0): Promise<T> {
  const { retries = DEFAULT_RETRIES, delay = DEFAULT_DELAY } = options

  try {
    return await action()
  } catch(error) {
    if(count >= retries) {
      throw error
    }

    await timeout(delay)

    return await retry(action, options, count + 1)
  }
}