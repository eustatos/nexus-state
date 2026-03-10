/**
 * SnapshotEventEmitter - Manages snapshot events
 */

import type { ISnapshotEventEmitter } from './types.interfaces';
import type { Snapshot } from '../types';

/**
 * Default implementation of snapshot event emitter
 */
export class SnapshotEventEmitter implements ISnapshotEventEmitter {
  private listeners: Map<'create' | 'error', Set<(snapshot: Snapshot) => void>> = new Map();

  constructor() {
    this.listeners.set('create', new Set());
    this.listeners.set('error', new Set());
  }

  /**
   * Subscribe to events
   */
  subscribe(event: 'create' | 'error', listener: (snapshot: Snapshot) => void): () => void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }

    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Emit event
   */
  emit(event: 'create' | 'error', snapshot?: Snapshot): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && snapshot) {
      eventListeners.forEach((listener) => {
        try {
          listener(snapshot);
        } catch (error) {
          console.error(`Snapshot event listener error (${event}):`, error);
        }
      });
    }
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.get('create')?.clear();
    this.listeners.get('error')?.clear();
  }

  /**
   * Get listener count
   */
  getListenerCount(event?: 'create' | 'error'): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }
    return (
      (this.listeners.get('create')?.size ?? 0) +
      (this.listeners.get('error')?.size ?? 0)
    );
  }
}
