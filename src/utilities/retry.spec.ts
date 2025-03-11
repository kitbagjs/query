import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { retry } from "./retry";

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('should not retry callback if it does not throw an error and resolve the promise', async () => {
  const callback = vi.fn()

  const result = retry(callback)

  expect(callback).toHaveBeenCalledOnce()

  await expect(result).resolves.toBeUndefined()
})

test('should retry callback if it throws an error and resolve the promise if it then succeeds', async () => {
  let count = 1

  const callback = vi.fn(() => {
    if(count === 1) {
      count++
      throw new Error('test')
    }

    return 'success'
  })

  const result = retry(callback, { retries: 1, delay: 100 })

  await vi.advanceTimersByTimeAsync(100)

  expect(callback).toHaveBeenCalledTimes(2)

  await expect(result).resolves.toBe('success')
})

test('should retry callback if it throws an error and reject the promise if it then fails', async () => {
  const error = new Error('test')
  const callback = vi.fn(() => {
    throw error
  })

  retry(callback, { retries: 3, delay: 100 }).catch(error => {
    expect(error).toBe(error)

    return 'error'
  })
  
  await vi.advanceTimersByTimeAsync(0)

  expect(callback).toHaveBeenCalled()

  await vi.advanceTimersByTimeAsync(300)

  expect(callback).toHaveBeenCalledTimes(4)
})