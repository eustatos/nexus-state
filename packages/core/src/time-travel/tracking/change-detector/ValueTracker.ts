/**
 * ValueTracker - Tracks previous values for change detection
 */

import type { IValueTracker } from './types.interfaces';

/**
 * Default implementation of value tracker
 */
export class ValueTracker implements IValueTracker {
  private values: Map<symbol, unknown> = new Map();

  /**
   * Store value for atom
   */
  storeValue(atomId: symbol, value: unknown): void {
    this.values.set(atomId, value);
  }

  /**
   * Get stored value
   */
  getValue(atomId: symbol): unknown {
    return this.values.get(atomId);
  }

  /**
   * Check if atom has stored value
   */
  hasValue(atomId: symbol): boolean {
    return this.values.has(atomId);
  }

  /**
   * Delete stored value
   */
  deleteValue(atomId: symbol): void {
    this.values.delete(atomId);
  }

  /**
   * Clear all values
   */
  clear(): void {
    this.values.clear();
  }
}
