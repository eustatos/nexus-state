/**
 * DevToolsIntegration - Provides DevTools integration
 *
 * Handles DevTools tracking and state serialization.
 */

import type { Store, Atom, ActionMetadata } from '../types';
import { serializeState as serializeStoreState } from '../utils/serialization';
import { storeLogger as logger } from '../debug';

export interface DevToolsStateUpdate {
  /** Atom name */
  atomName: string;
  /** New value */
  value: unknown;
  /** Timestamp */
  timestamp: number;
}

export interface DevToolsAction {
  /** Action type */
  type: string;
  /** Timestamp */
  timestamp: number;
  /** Metadata */
  metadata?: ActionMetadata;
}

export interface DevToolsConfig {
  /** Enable DevTools */
  enabled: boolean;
  /** Enable stack trace */
  enableStackTrace: boolean;
  /** Debounce delay */
  debounceDelay: number;
}

/**
 * DevToolsIntegration provides DevTools support
 */
export class DevToolsIntegration {
  private config: DevToolsConfig;
  private pendingUpdates: DevToolsStateUpdate[] = [];
  private actions: DevToolsAction[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config?: Partial<DevToolsConfig>) {
    this.config = {
      enabled: config?.enabled ?? false,
      enableStackTrace: config?.enableStackTrace ?? false,
      debounceDelay: config?.debounceDelay ?? 100,
    };
  }

  /**
   * Track state change
   * @param atom Changed atom
   * @param value New value
   */
  trackStateChange(atom: Atom<any>, value: unknown): void {
    if (!this.config.enabled) {
      return;
    }

    this.pendingUpdates.push({
      atomName: atom.name || atom.toString(),
      value,
      timestamp: Date.now(),
    });

    this.scheduleFlush();
  }

  /**
   * Track action
   * @param action Action metadata
   */
  trackAction(action: DevToolsAction): void {
    if (!this.config.enabled) {
      return;
    }

    this.actions.push(action);
    logger.log('[DevTools] Tracked action:', action.type);
  }

  /**
   * Set value with metadata
   * @param atom Atom to set
   * @param value Value to set
   * @param metadata Action metadata
   * @param setFn Set function
   */
  setWithMetadata<Value>(
    atom: Atom<Value>,
    value: Value | ((prev: Value) => Value),
    metadata: ActionMetadata | undefined,
    setFn: (atom: Atom<Value>, update: Value | ((prev: Value) => Value)) => void
  ): void {
    // Add stack trace if enabled
    if (this.config.enableStackTrace && metadata) {
      const stack = new Error().stack;
      if (stack) {
        metadata.stackTrace = stack;
      }
    }

    // Set the value
    setFn(atom, value);

    // Track action
    if (metadata) {
      this.trackAction({
        type: metadata.type || 'SET',
        timestamp: Date.now(),
        metadata,
      });
    }
  }

  /**
   * Serialize store state
   * @param store Store instance
   * @returns Serialized state
   */
  serializeState(store: Store): Record<string, unknown> {
    return serializeStoreState(store);
  }

  /**
   * Get intercepted getter
   * @param get Original getter
   * @returns Intercepted getter
   */
  createInterceptedGetter(get: <Value>(atom: Atom<Value>) => Value) {
    return <Value>(atom: Atom<Value>): Value => {
      // In a real implementation, track the get operation
      return get(atom);
    };
  }

  /**
   * Get intercepted setter
   * @param set Original setter
   * @returns Intercepted setter
   */
  createInterceptedSetter(
    set: <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)) => void
  ) {
    return <Value>(
      atom: Atom<Value>,
      update: Value | ((prev: Value) => Value)
    ): void => {
      const metadata: ActionMetadata = {
        type: 'SET',
        timestamp: Date.now(),
      };
      this.setWithMetadata(atom, update, metadata, set);
    };
  }

  /**
   * Schedule flush of pending updates
   */
  private scheduleFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushUpdates();
    }, this.config.debounceDelay);
  }

  /**
   * Flush pending updates
   */
  private flushUpdates(): void {
    if (this.pendingUpdates.length > 0) {
      // In a real implementation, send updates to DevTools
      logger.log(
        '[DevTools] Flushing updates:',
        this.pendingUpdates.length
      );
      this.pendingUpdates = [];
    }
  }

  /**
   * Enable DevTools
   */
  enable(): void {
    this.config.enabled = true;
    logger.log('[DevTools] Enabled');
  }

  /**
   * Disable DevTools
   */
  disable(): void {
    this.config.enabled = false;
    logger.log('[DevTools] Disabled');
  }

  /**
   * Get configuration
   */
  getConfig(): DevToolsConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<DevToolsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get pending updates
   */
  getPendingUpdates(): DevToolsStateUpdate[] {
    return [...this.pendingUpdates];
  }

  /**
   * Get tracked actions
   */
  getActions(): DevToolsAction[] {
    return [...this.actions];
  }

  /**
   * Clear all tracked data
   */
  clear(): void {
    this.pendingUpdates = [];
    this.actions = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
