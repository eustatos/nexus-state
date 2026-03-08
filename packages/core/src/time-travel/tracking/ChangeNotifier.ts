/**
 * ChangeNotifier - Manages change notifications for computed atoms
 *
 * Provides event-based notification system for when
 * dependencies change and recomputation is needed.
 */

import type { TrackedAtom } from './types';

/**
 * Change event data
 */
export interface ChangeEvent {
  /** Atom that changed */
  atom: TrackedAtom;
  /** Timestamp of change */
  timestamp: number;
  /** Change type */
  type: 'value' | 'metadata' | 'deleted';
}

/**
 * Change listener callback
 */
export type ChangeListener = (event: ChangeEvent) => void;

/**
 * Unsubscribe function
 */
export type UnsubscribeFn = () => void;

/**
 * ChangeNotifier provides event-based notifications
 * for atom changes without external dependencies
 */
export class ChangeNotifier {
  /** Map of atom ID to set of listeners */
  private listeners: Map<symbol, Set<ChangeListener>> = new Map();

  /** Global listeners (called for any change) */
  private globalListeners: Set<ChangeListener> = new Set();

  /** Pending changes queue */
  private pendingChanges: ChangeEvent[] = [];

  /** Batch mode flag */
  private isBatching = false;

  /**
   * Subscribe to changes for specific atom
   * @param atomId - Atom ID to watch
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(atomId: symbol, listener: ChangeListener): UnsubscribeFn;

  /**
   * Subscribe to all changes (global listener)
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: ChangeListener): UnsubscribeFn;

  subscribe(
    atomIdOrListener: symbol | ChangeListener,
    listener?: ChangeListener
  ): UnsubscribeFn {
    // Global subscription
    if (typeof atomIdOrListener === 'function') {
      this.globalListeners.add(atomIdOrListener);
      return () => {
        this.globalListeners.delete(atomIdOrListener);
      };
    }

    // Specific atom subscription
    const atomId = atomIdOrListener;
    if (!this.listeners.has(atomId)) {
      this.listeners.set(atomId, new Set());
    }
    this.listeners.get(atomId)!.add(listener!);

    return () => {
      const atomListeners = this.listeners.get(atomId);
      if (atomListeners) {
        atomListeners.delete(listener!);
        // Clean up empty sets
        if (atomListeners.size === 0) {
          this.listeners.delete(atomId);
        }
      }
    };
  }

  /**
   * Notify listeners of a change
   * @param atom - Atom that changed
   * @param type - Type of change
   */
  notify(atom: TrackedAtom, type: ChangeEvent['type'] = 'value'): void {
    const event: ChangeEvent = {
      atom,
      timestamp: Date.now(),
      type,
    };

    if (this.isBatching) {
      // Queue change for later
      this.pendingChanges.push(event);
    } else {
      // Send immediately
      this.sendNotification(event);
    }
  }

  /**
   * Send notification to all relevant listeners
   * @param event - Change event
   */
  private sendNotification(event: ChangeEvent): void {
    // Call global listeners
    this.globalListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in global change listener:', error);
      }
    });

    // Call atom-specific listeners
    const atomListeners = this.listeners.get(event.atom.id);
    if (atomListeners) {
      atomListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in atom change listener:', error);
        }
      });
    }
  }

  /**
   * Start batching notifications
   * Changes will be queued until endBatch() is called
   */
  startBatch(): void {
    this.isBatching = true;
    this.pendingChanges = [];
  }

  /**
   * End batching and send all queued notifications
   */
  endBatch(): void {
    this.isBatching = false;

    // Send all pending changes
    const changes = [...this.pendingChanges];
    this.pendingChanges = [];

    changes.forEach((event) => {
      this.sendNotification(event);
    });
  }

  /**
   * Check if currently batching
   * @returns True if batching
   */
  getIsBatching(): boolean {
    return this.isBatching;
  }

  /**
   * Get number of pending changes
   * @returns Pending change count
   */
  getPendingCount(): number {
    return this.pendingChanges.length;
  }

  /**
   * Clear pending changes without sending
   */
  clearPending(): void {
    this.pendingChanges = [];
  }

  /**
   * Get statistics about listeners
   * @returns Statistics object
   */
  getStats(): {
    totalListeners: number;
    atomCount: number;
    globalListeners: number;
    pendingChanges: number;
  } {
    let totalListeners = 0;
    this.listeners.forEach((set) => {
      totalListeners += set.size;
    });

    return {
      totalListeners,
      atomCount: this.listeners.size,
      globalListeners: this.globalListeners.size,
      pendingChanges: this.pendingChanges.length,
    };
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
    this.pendingChanges = [];
    this.isBatching = false;
  }

  /**
   * Remove all listeners for specific atom
   * @param atomId - Atom ID
   */
  clearAtomListeners(atomId: symbol): void {
    this.listeners.delete(atomId);
  }
}
