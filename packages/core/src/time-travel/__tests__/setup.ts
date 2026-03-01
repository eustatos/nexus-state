/**
 * Test setup for time travel edge case tests
 * Configures global test hooks and utilities
 */

import { beforeAll, afterEach, vi } from "vitest";
import { atomRegistry } from "../../atom-registry";

/**
 * Global setup before all tests
 */
beforeAll(() => {
  // Force garbage collection if available (Node.js with --expose-gc)
  if (typeof global.gc === "function") {
    global.gc();
  }

  // Clear atom registry before all tests
  atomRegistry.clear();

  console.log("[TEST SETUP] Global test setup complete");
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset timers
  vi.useRealTimers();

  // Force garbage collection if available
  if (typeof global.gc === "function") {
    global.gc();
  }

  // Clear atom registry after each test to prevent test interference
  atomRegistry.clear();
});

/**
 * Custom matchers for time travel tests
 */
interface CustomMatchers<R = unknown> {
  /**
   * Check if a mock function was called once with specific arguments
   */
  toHaveBeenCalledOnceWith(...expected: unknown[]): R;
}

/**
 * Extend Vitest expect with custom matchers
 */
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends CustomMatchers<T> {
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatchers {
  }
}

// Register custom matchers
expect.extend({
  toHaveBeenCalledOnceWith(received: any, ...expected: unknown[]) {
    const calls = received.mock.calls;
    const pass =
      calls.length === 1 &&
      JSON.stringify(calls[0]) === JSON.stringify(expected);

    return {
      pass,
      message: () =>
        `expected ${received} to have been called once with ${JSON.stringify(expected)}, but was called ${calls.length} times with ${JSON.stringify(calls)}`,
    };
  },
});

/**
 * Helper function to wait for a specified number of milliseconds
 * @param ms Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function to run a function and measure its execution time
 * @param fn Function to measure
 * @returns Object with result and duration in milliseconds
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Helper function to measure synchronous function execution time
 * @param fn Function to measure
 * @returns Object with result and duration in milliseconds
 */
export function measureTimeSync<T>(
  fn: () => T,
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  return Promise.resolve({ result, duration });
}

/**
 * Helper function to retry a function until it succeeds or max attempts reached
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param delay Delay between attempts in milliseconds
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 100,
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxAttempts - 1) {
        await waitFor(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Helper function to suppress console output during tests
 * @param fn Function to run with suppressed console
 */
export async function suppressConsole<T>(fn: () => Promise<T>): Promise<T> {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  // Replace with no-op functions
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};

  try {
    return await fn();
  } finally {
    // Restore original console
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  }
}
