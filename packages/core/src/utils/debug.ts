/**
 * Debug logging utility that only logs in development mode.
 * Automatically stripped in production builds.
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export interface DebugContext {
  scope: string;
  enabled: boolean;
}

export function createDebugger(scope: string): (...args: unknown[]) => void {
  if (!IS_DEV) {
    // Return no-op function that gets stripped by bundlers
    return () => undefined;
  }

  return (...args: unknown[]) => {
    console.log(`[${scope}]`, ...args);
  };
}

// Namespace-specific debuggers
export const debugStore = createDebugger('STORE');
export const debugAtom = createDebugger('ATOM');
export const debugTimeTravel = createDebugger('TIME-TRAVEL');
