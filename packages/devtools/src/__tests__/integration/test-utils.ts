/**
 * Test utilities for DevTools integration tests.
 */

import { vi } from "vitest";
import type { DevToolsMessage } from "../../types";

export interface TestMessage {
  type: string;
  payload: any;
  timestamp: number;
}

/**
 * Wait for a condition to be true with timeout.
 */
export function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

/**
 * Create a mock atom for testing.
 */
export function createMockAtom(id: string, defaultValue: any = 0) {
  return {
    id: {
      toString: () => id,
    },
    defaultValue,
  };
}

/**
 * Create a mock action for testing.
 */
export function createMockAction(type: string, payload?: any) {
  return {
    type,
    payload,
    timestamp: Date.now(),
    metadata: {
      source: "test",
      atomNames: ["test-atom"],
    },
  };
}

/**
 * Create a mock state for testing.
 */
export function createMockState(atoms: Record<string, any> = {}) {
  return {
    ...atoms,
    _timestamp: Date.now(),
  };
}

/**
 * Create a mock DevTools message.
 */
export function createMockDevToolsMessage(
  type: DevToolsMessage["type"],
  payload: any,
): DevToolsMessage {
  return {
    type,
    payload: {
      ...payload,
      timestamp: Date.now(),
    },
    // Note: 'source' is not part of the DevToolsMessage type
  };
}

/**
 * Mock console methods and track calls.
 */
export function mockConsole() {
  const originalConsole = { ...console };
  const calls = {
    log: [] as any[],
    warn: [] as any[],
    error: [] as any[],
    info: [] as any[],
  };

  console.log = vi.fn((...args) => {
    calls.log.push(args);
    originalConsole.log(...args);
  });

  console.warn = vi.fn((...args) => {
    calls.warn.push(args);
    originalConsole.warn(...args);
  });

  console.error = vi.fn((...args) => {
    calls.error.push(args);
    originalConsole.error(...args);
  });

  console.info = vi.fn((...args) => {
    calls.info.push(args);
    originalConsole.info(...args);
  });

  return {
    calls,
    restore: () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    },
  };
}

/**
 * Create a message listener that collects messages.
 */
export function createMessageCollector() {
  const messages: DevToolsMessage[] = [];

  return {
    listener: (message: DevToolsMessage) => {
      messages.push(message);
    },
    getMessages: () => [...messages],
    clear: () => {
      messages.length = 0;
    },
    waitForMessage: (type: string, timeout = 1000) => {
      return waitFor(() => messages.some((msg) => msg.type === type), timeout);
    },
  };
}

/**
 * Simulate different browser environments.
 */
export function simulateBrowserEnvironment(
  browser: "chrome" | "firefox" | "safari" | "edge",
) {
  const originalWindow = (global as any).window;

  const userAgents = {
    chrome:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    firefox:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    safari:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  };

  (global as any).window = {
    ...originalWindow,
    navigator: {
      ...(originalWindow?.navigator || {}),
      userAgent: userAgents[browser],
    },
  };

  return {
    restore: () => {
      (global as any).window = originalWindow;
    },
  };
}

/**
 * Helper to run test with simulated network conditions.
 */
export async function withNetworkConditions<T>(
  conditions: { latency?: number; throughput?: number },
  testFn: () => Promise<T> | T,
): Promise<T> {
  const originalSetTimeout = global.setTimeout;
  const originalDateNow = Date.now;

  if (conditions.latency) {
    // Simulate latency by delaying setTimeout
    global.setTimeout = vi.fn((fn, delay) => {
      const actualDelay = (delay || 0) + conditions.latency!;
      return originalSetTimeout(fn, actualDelay);
    }) as any;
  }

  try {
    return await (typeof testFn === "function" ? testFn() : testFn);
  } finally {
    global.setTimeout = originalSetTimeout;
    Date.now = originalDateNow;
  }
}
