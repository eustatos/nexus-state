import type { DevToolsConnection } from "./types";

/**
 * Create a fallback connection that does nothing (no-op)
 * @returns DevToolsConnection implementation with no-op behavior
 */
export function createFallbackConnection(): DevToolsConnection {
  return {
    send: (): void => {
      // No-op: silently ignore send attempts
    },
    subscribe: (): (() => void) => {
      // No-op: return no-op unsubscribe function
      return (): void => {};
    },
    init: (): void => {
      // No-op: silently ignore init attempts
    },
    unsubscribe: (): void => {
      // No-op: silently ignore unsubscribe attempts
    },
  };
}
