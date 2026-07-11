/**
 * Debug logger that only works in development
 * @packageDocumentation
 */

// Check for multiple possible environments
const isTest =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const isBenchmark =
  typeof process !== 'undefined' && process.env?.BENCHMARK === 'true';
const DEBUG =
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV !== 'production' &&
  !isTest &&
  !isBenchmark;

type LogLevel = 'log' | 'warn' | 'error' | 'info';

/**
 * Debug logger class with conditional logging based on environment
 */
class DebugLogger {
  private enabled: boolean;
  private prefix: string;

  constructor(prefix: string = '[Nexus]') {
    this.enabled = DEBUG;
    this.prefix = prefix;
  }

  private format(level: LogLevel, ...args: unknown[]): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console[level](`${this.prefix}[${timestamp}]`, ...args);
  }

  log(...args: unknown[]): void {
    this.format('log', ...args);
  }

  warn(...args: unknown[]): void {
    this.format('warn', ...args);
  }

  error(...args: unknown[]): void {
    this.format('error', ...args);
  }

  info(...args: unknown[]): void {
    this.format('info', ...args);
  }

  group(label: string): void {
    if (!this.enabled) return;
    console.group(`${this.prefix} ${label}`);
  }

  groupEnd(): void {
    if (!this.enabled) return;
    console.groupEnd();
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Lazy logger instances — created on first access, not at import time
let _logger: DebugLogger | null = null;
let _storeLogger: DebugLogger | null = null;
let _atomLogger: DebugLogger | null = null;
let _reactLogger: DebugLogger | null = null;

/**
 * Get the main debug logger (created lazily on first call)
 */
export function getLogger(): DebugLogger {
  if (!_logger) _logger = new DebugLogger('[Nexus]');
  return _logger;
}

/**
 * Get the store debug logger (created lazily on first call)
 */
export function getStoreLogger(): DebugLogger {
  if (!_storeLogger) _storeLogger = new DebugLogger('[Nexus:Store]');
  return _storeLogger;
}

/**
 * Get the atom debug logger (created lazily on first call)
 */
export function getAtomLogger(): DebugLogger {
  if (!_atomLogger) _atomLogger = new DebugLogger('[Nexus:Atom]');
  return _atomLogger;
}

/**
 * Get the react debug logger (created lazily on first call)
 */
export function getReactLogger(): DebugLogger {
  if (!_reactLogger) _reactLogger = new DebugLogger('[Nexus:React]');
  return _reactLogger;
}

// Backward-compatible named exports (lazy via Proxy)
export const logger = new Proxy({} as DebugLogger, {
  get(_target, prop) {
    return Reflect.get(getLogger(), prop);
  },
}) as DebugLogger;

export const storeLogger = new Proxy({} as DebugLogger, {
  get(_target, prop) {
    return Reflect.get(getStoreLogger(), prop);
  },
}) as DebugLogger;

export const atomLogger = new Proxy({} as DebugLogger, {
  get(_target, prop) {
    return Reflect.get(getAtomLogger(), prop);
  },
}) as DebugLogger;

export const reactLogger = new Proxy({} as DebugLogger, {
  get(_target, prop) {
    return Reflect.get(getReactLogger(), prop);
  },
}) as DebugLogger;

// Export class for testing
export { DebugLogger };

// DevTools plugin is exported via @nexus-state/core/devtools subpath.
// Do NOT re-export here — it pulls DevToolsPlugin into the debug module,
// which is imported by StoreImpl and forces the entire DevTools chain into
// even the minimal bundle.
