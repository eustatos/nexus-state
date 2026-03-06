/**
 * StoreWrapper - Wraps store.set for automatic change capture
 *
 * Provides a wrapper around the store's set method to automatically
 * capture changes for time travel tracking.
 */

import type { Atom, Store } from '../../types';
import { SnapshotService } from './SnapshotService';
import { storeLogger as logger } from '../../debug';

export interface StoreWrapperConfig {
  /** Enable auto-capture on store.set */
  autoCapture: boolean;
  /** Capture debounce time in milliseconds */
  captureDebounceTime: number;
  /** Ignore certain atoms by name */
  ignoreAtoms: string[];
}

export interface StoreWrapperResult {
  /** Whether operation was successful */
  success: boolean;
  /** Snapshot captured (if auto-capture enabled) */
  snapshotId?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * StoreWrapper provides store.set wrapping
 * for automatic change capture
 */
export class StoreWrapper {
  private store: Store;
  private snapshotService: SnapshotService;
  private config: StoreWrapperConfig;
  private originalSet: Store['set'];
  private isWrapped: boolean = false;
  private captureTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingCaptures: Set<string> = new Set();

  constructor(
    store: Store,
    snapshotService: SnapshotService,
    config?: Partial<StoreWrapperConfig>
  ) {
    this.store = store;
    this.snapshotService = snapshotService;
    this.config = {
      autoCapture: config?.autoCapture ?? false,
      captureDebounceTime: config?.captureDebounceTime ?? 100,
      ignoreAtoms: config?.ignoreAtoms ?? [],
    };
    this.originalSet = store.set.bind(store);
  }

  /**
   * Wrap store.set to enable auto-capture
   */
  wrap(): void {
    if (this.isWrapped) {
      logger.warn('[StoreWrapper] Already wrapped');
      return;
    }

    const self = this;
    const originalSet = this.originalSet;

    this.store.set = function <Value>(
      atom: Atom<Value>,
      update: Value | ((prev: Value) => Value)
    ): void {
      // Call original set
      originalSet(atom, update);

      // Auto-capture if enabled
      if (self.config.autoCapture) {
        self.scheduleCapture(atom as Atom<unknown>);
      }
    } as typeof this.store.set;

    this.isWrapped = true;
    logger.log('[StoreWrapper] Wrapped store.set');
  }

  /**
   * Unwrap store.set to disable auto-capture
   */
  unwrap(): void {
    if (!this.isWrapped) {
      logger.warn('[StoreWrapper] Not wrapped');
      return;
    }

    this.store.set = this.originalSet;
    this.isWrapped = false;

    // Clear pending captures
    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
      this.captureTimeout = null;
    }
    this.pendingCaptures.clear();

    logger.log('[StoreWrapper] Unwrapped store.set');
  }

  /**
   * Schedule a capture for an atom change
   * @param atom Atom that changed
   */
  private scheduleCapture(atom: Atom<unknown>): void {
    // Ignore atoms in ignore list
    if (this.config.ignoreAtoms.includes(atom.name || '')) {
      return;
    }

    // Add to pending captures
    this.pendingCaptures.add(atom.name || atom.id.toString());

    // Clear existing timeout
    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
    }

    // Schedule capture after debounce time
    this.captureTimeout = setTimeout(() => {
      this.performCapture();
    }, this.config.captureDebounceTime);
  }

  /**
   * Perform scheduled capture
   */
  private performCapture(): void {
    if (this.pendingCaptures.size === 0) {
      return;
    }

    const atoms = Array.from(this.pendingCaptures);
    this.pendingCaptures.clear();

    // Capture snapshot with atom names as action
    const action = `auto: ${atoms.join(', ')}`;
    const result = this.snapshotService.capture(action);

    if (result.success) {
      logger.log(
        `[StoreWrapper] Auto-captured snapshot: ${result.snapshot?.id} for atoms: ${atoms.join(', ')}`
      );
    } else {
      logger.error(
        `[StoreWrapper] Failed to auto-capture snapshot: ${result.error}`
      );
    }
  }

  /**
   * Manually capture a snapshot
   * @param action Optional action name
   * @returns Snapshot ID or undefined
   */
  capture(action?: string): string | undefined {
    const result = this.snapshotService.capture(action);
    if (result.success && result.snapshot) {
      return result.snapshot.id;
    }
    return undefined;
  }

  /**
   * Check if store is wrapped
   * @returns True if wrapped
   */
  getIsWrapped(): boolean {
    return this.isWrapped;
  }

  /**
   * Get configuration
   */
  getConfig(): StoreWrapperConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<StoreWrapperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose store wrapper
   */
  dispose(): void {
    this.unwrap();
  }
}
