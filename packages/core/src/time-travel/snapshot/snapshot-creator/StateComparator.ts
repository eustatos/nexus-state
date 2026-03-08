/**
 * StateComparator - Compares snapshot states
 */

import type { IStateComparator } from './types.interfaces';
import type { SnapshotStateEntry } from '../types';

/**
 * Default implementation of state comparator
 */
export class StateComparator implements IStateComparator {
  /**
   * Compare two states
   */
  statesEqual(
    a: Record<string, SnapshotStateEntry>,
    b: Record<string, SnapshotStateEntry>
  ): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!this.entriesEqual(a[key], b[key])) return false;
    }

    return true;
  }

  /**
   * Compare two values
   */
  valuesEqual(a: unknown, b: unknown): boolean {
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return a === b;
  }

  /**
   * Compare two state entries
   */
  private entriesEqual(a: SnapshotStateEntry, b: SnapshotStateEntry): boolean {
    if (a.type !== b.type) return false;
    if (a.name !== b.name) return false;
    if (a.atomId !== b.atomId) return false;
    return this.valuesEqual(a.value, b.value);
  }
}
