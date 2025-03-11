import { expect, test, vi } from "vitest";
import { retry } from "./retry";

test('should not retry callback if it does not throw an error', async () => {
  const callback = vi.fn()

  await retry(callback)

  expect(callback).toHaveBeenCalledOnce()
})

test('should retry callback if it throws an error', async () => {
  vi.useFakeTimers()

  const callback = vi.fn(() => {
    throw new Error('test')
  })

  const result = retry(callback, { retries: 3, delay: 100 })

  expect(callback).toHaveBeenCalled()
  vi.resetAllMocks()

  await vi.advanceTimersByTimeAsync(300)

  expect(callback).toHaveBeenCalledTimes(3)

  await expect(result).rejects.toThrow('test')
})