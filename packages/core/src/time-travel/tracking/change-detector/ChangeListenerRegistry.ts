/**
 * ChangeListenerRegistry - Manages change listeners
 */

import type { ChangeEvent } from '../types';
import type { IChangeListenerRegistry } from './types.interfaces';

/**
 * Default implementation of change listener registry
 */
export class ChangeListenerRegistry implements IChangeListenerRegistry {
  private listeners: Map<symbol, Set<(event: ChangeEvent) => void>> = new Map();
  private globalListeners: Set<(event: ChangeEvent) => void> = new Set();

  /**
   * Add listener for specific atom
   */
  addListener(atomId: symbol, listener: (event: ChangeEvent) => void): () => void {
    if (!this.listeners.has(atomId)) {
      this.listeners.set(atomId, new Set());
    }
    this.listeners.get(atomId)!.add(listener);

    return () => this.removeListener(atomId, listener);
  }

  /**
   * Remove listener for atom
   */
  removeListener(atomId: symbol, listener: (event: ChangeEvent) => void): void {
    const atomListeners = this.listeners.get(atomId);
    if (atomListeners) {
      atomListeners.delete(listener);
      if (atomListeners.size === 0) {
        this.listeners.delete(atomId);
      }
    }
  }

  /**
   * Add global listener
   */
  addGlobalListener(listener: (event: ChangeEvent) => void): () => void {
    this.globalListeners.add(listener);
    return () => this.removeGlobalListener(listener);
  }

  /**
   * Remove global listener
   */
  removeGlobalListener(listener: (event: ChangeEvent) => void): void {
    this.globalListeners.delete(listener);
  }

  /**
   * Notify listeners of change
   */
  notify(event: ChangeEvent): void {
    // Atom-specific listeners
    const atomListeners = this.listeners.get(event.atomId);
    if (atomListeners) {
      atomListeners.forEach((listener) => {
        this.safeCall(listener, event, 'Change listener error');
      });
    }

    // Global listeners
    this.globalListeners.forEach((listener) => {
      this.safeCall(listener, event, 'Global change listener error');
    });
  }

  /**
   * Safely call listener with error handling
   */
  private safeCall(
    listener: (event: ChangeEvent) => void,
    event: ChangeEvent,
    errorMsg: string,
  ): void {
    try {
      listener(event);
    } catch (error) {
      console.error(errorMsg, error);
    }
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return (
      this.globalListeners.size +
      Array.from(this.listeners.values()).reduce(
        (sum, set) => sum + set.size,
        0,
      )
    );
  }

  /**
   * Check if atom has listeners
   */
  hasListeners(atomId: symbol): boolean {
    const atomListeners = this.listeners.get(atomId);
    return atomListeners !== undefined && atomListeners.size > 0;
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}
