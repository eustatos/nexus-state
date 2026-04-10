/**
 * DevTools Plugin — optional Redux DevTools integration
 *
 * Tree-shakeable plugin that connects to Redux DevTools Extension.
 * Only included in bundle when explicitly imported from '@nexus-state/core/debug'.
 *
 * @packageDocumentation
 */

import type { Store, Plugin, PluginHooks, Atom } from '../types';

/**
 * Options for DevTools plugin
 */
export interface DevToolsOptions {
  /** Display name in DevTools UI */
  name?: string;
  /** Enable DevTools (default: true in development) */
  enabled?: boolean;
  /** Maximum history entries for time-travel */
  maxHistory?: number;
}

/**
 * State update entry for history
 */
interface HistoryEntry {
  state: Record<string, unknown>;
  action: string;
  timestamp: number;
}

/**
 * Redux DevTools Extension connection interface
 */
interface DevToolsConnection {
  init(state: Record<string, unknown>): void;
  send(action: Record<string, unknown>, state: Record<string, unknown>): void;
  subscribe(callback: (message: unknown) => void): () => void;
  disconnect?(): void;
}

/**
 * Redux DevTools Extension global
 */
interface DevToolsExtension {
  connect(options: { name: string }): DevToolsConnection;
}

/**
 * DevTools plugin factory — connects store to Redux DevTools Extension.
 *
 * @example
 * ```typescript
 * import { createStore } from '@nexus-state/core';
 * import { devtools } from '@nexus-state/core/debug';
 *
 * const store = createStore([devtools()]);
 * ```
 */
export function devtools(options?: DevToolsOptions): Plugin {
  const plugin = new DevToolsPluginImpl(options);
  // Return a plugin function that closes the plugin instance
  const pluginFn: Plugin = (store: Store): PluginHooks | void => {
    plugin.apply(store);
  };
  return pluginFn;
}

/**
 * Internal class implementation
 */
class DevToolsPluginImpl {
  private connection: DevToolsConnection | null = null;
  private history: HistoryEntry[] = [];
  private store: Store | null = null;
  private options: Required<DevToolsOptions>;
  private unsubscribe: (() => void) | null = null;

  constructor(options?: DevToolsOptions) {
    const isDev =
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production';

    this.options = {
      name: options?.name ?? 'NexusState',
      enabled: options?.enabled ?? isDev,
      maxHistory: options?.maxHistory ?? 50,
    };
  }

  /**
   * Apply plugin to store
   */
  apply(store: Store): void {
    if (!this.options.enabled) {
      return;
    }

    this.store = store;
    this.connect();
  }

  /**
   * Connect to Redux DevTools Extension
   */
  private connect(): void {
    const win = typeof globalThis !== 'undefined' && typeof (globalThis as Record<string, unknown>).window !== 'undefined'
      ? (globalThis as Record<string, unknown>).window
      : undefined;

    if (win === undefined) {
      return;
    }

    const devToolsExt = (win as Record<string, unknown>)[
      '__REDUX_DEVTOOLS_EXTENSION__'
    ] as DevToolsExtension | undefined;

    if (devToolsExt === undefined) {
      return;
    }

    try {
      this.connection = devToolsExt.connect({
        name: this.options.name,
      });

      // Listen for DevTools commands (time-travel, etc.)
      this.unsubscribe = this.connection.subscribe((message: unknown) => {
        const msg = message as { type?: string; payload?: { type?: string; index?: number } };
        if (msg.type === 'DISPATCH' && msg.payload !== undefined) {
          this.handleDispatch(msg.payload);
        }
      });

      // Send initial state
      if (this.store !== null) {
        this.connection.init(this.store.getState());
      }
    } catch {
      // Silently ignore if DevTools extension fails
      this.connection = null;
    }
  }

  /**
   * Track state change — call this after each atom set
   */
  trackStateChange(atom: Atom<unknown>, _value: unknown): void {
    if (this.connection === null || this.store === null) {
      return;
    }

    const state = this.store.getState();
    const actionName = 'SET:' + (atom.name ?? atom.id.toString());

    this.connection.send(
      { type: actionName },
      state
    );

    // Record history for time-travel
    this.history.push({
      state: state,
      action: actionName,
      timestamp: Date.now(),
    });

    // Enforce max history
    if (this.history.length > this.options.maxHistory) {
      this.history = this.history.slice(this.history.length - this.options.maxHistory);
    }
  }

  /**
   * Track custom action
   */
  trackAction(actionName: string, payload: unknown): void {
    if (this.connection === null || this.store === null) {
      return;
    }

    const state = this.store.getState();

    this.connection.send(
      { type: actionName, payload: payload },
      state
    );

    this.history.push({
      state: state,
      action: actionName,
      timestamp: Date.now(),
    });

    if (this.history.length > this.options.maxHistory) {
      this.history = this.history.slice(this.history.length - this.options.maxHistory);
    }
  }

  /**
   * Handle dispatch from DevTools UI
   */
  private handleDispatch(payload: { type?: string; index?: number }): void {
    if (this.store === null) {
      return;
    }

    if (payload.type === 'JUMP_TO_STATE' && payload.index !== undefined) {
      const entry = this.history[payload.index];
      if (entry === undefined) {
        return;
      }

      // Restore state via setState (uses atom names)
      if (this.store.setState !== undefined) {
        this.store.setState(entry.state);
      }
    }

    if (payload.type === 'RESET') {
      this.history = [];
    }
  }

  /**
   * Disconnect from DevTools and clean up
   */
  disconnect(): void {
    if (this.unsubscribe !== null) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.connection !== null && this.connection.disconnect !== undefined) {
      this.connection.disconnect();
    }

    this.connection = null;
    this.history = [];
    this.store = null;
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }
}

/**
 * DevToolsPlugin class — use `devtools()` factory instead for convenience.
 * @deprecated Use `devtools()` factory function
 */
export class DevToolsPlugin {
  private impl: DevToolsPluginImpl;

  constructor(options?: DevToolsOptions) {
    this.impl = new DevToolsPluginImpl(options);
  }

  /** @deprecated Use `devtools()` factory — returns plugin function */
  apply(store: Store): void {
    this.impl.apply(store);
  }

  /** Disconnect from DevTools */
  disconnect(): void {
    this.impl.disconnect();
  }

  /** Get history length */
  getHistoryLength(): number {
    return this.impl.getHistoryLength();
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.impl.isConnected();
  }

  /** Track state change */
  trackStateChange(atom: Atom<unknown>, value: unknown): void {
    this.impl.trackStateChange(atom, value);
  }

  /** Track custom action */
  trackAction(actionName: string, payload: unknown): void {
    this.impl.trackAction(actionName, payload);
  }
}
