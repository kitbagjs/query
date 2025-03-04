import { createIntervalController } from "./intervalController"
import { vi, test, expect, beforeEach, afterEach } from "vitest"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('given interval of Infinity, does not run', async () => {
  const intervalController = createIntervalController()
  const action = vi.fn()

  intervalController.set(action, Infinity)

  await vi.runOnlyPendingTimersAsync()

  expect(action).not.toHaveBeenCalled()

  intervalController.clear()
})

test('given interval of 5, runs after 5ms', async () => {
  const intervalController = createIntervalController()
  const action = vi.fn()

  intervalController.set(action, 5)

  await vi.advanceTimersByTimeAsync(5)

  expect(action).toHaveBeenCalledOnce()

  intervalController.clear()
})

test('given interval that is later cancelled, does not run', async () => {
  const intervalController = createIntervalController()
  const action = vi.fn()

  intervalController.set(action, 5)

  await vi.advanceTimersByTimeAsync(4)

  intervalController.clear()

  await vi.runOnlyPendingTimersAsync()

  expect(action).not.toHaveBeenCalled()
})