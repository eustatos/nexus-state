/**
 * Debug logger that only works in development
 * @packageDocumentation
 */

// Check for multiple possible environments
const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const isBenchmark = typeof process !== 'undefined' && process.env?.BENCHMARK === 'true';
const DEBUG = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && !isTest && !isBenchmark;

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

export const logger = new DebugLogger('[Nexus]');
export const storeLogger = new DebugLogger('[Nexus:Store]');
export const atomLogger = new DebugLogger('[Nexus:Atom]');
export const reactLogger = new DebugLogger('[Nexus:React]');
