/**
 * PrimitiveChangeDetector - Detects changes in primitive atoms
 *
 * Specialized change detector for primitive atom types.
 */

import type { ChangeEvent, TrackedAtom } from '../types';
import { ChangeComparisonStrategy } from './ChangeComparisonStrategy';

/**
 * PrimitiveChangeDetector provides change detection
 * for primitive atoms without external dependencies
 */
export class PrimitiveChangeDetector {
  private comparisonStrategy: ChangeComparisonStrategy;

  constructor(comparisonStrategy?: ChangeComparisonStrategy) {
    this.comparisonStrategy = comparisonStrategy || new ChangeComparisonStrategy();
  }

  /**
   * Detect change in primitive atom
   * @param atom - Tracked atom
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns Change event or null if no change
   */
  detectChange(
    atom: TrackedAtom,
    oldValue: unknown,
    newValue: unknown
  ): ChangeEvent | null {
    const comparison = this.comparisonStrategy.compare(oldValue, newValue);

    if (!comparison.hasChanged) {
      return null;
    }

    return {
      atom: atom.atom,
      atomId: atom.id,
      atomName: atom.name,
      oldValue,
      newValue,
      timestamp: Date.now(),
      type: comparison.changeType === 'created' ? 'created' :
            comparison.changeType === 'deleted' ? 'deleted' :
            comparison.changeType === 'type' ? 'type' : 'value',
    };
  }

  /**
   * Check if primitive atom has changed
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns True if changed
   */
  hasChanged(oldValue: unknown, newValue: unknown): boolean {
    return this.comparisonStrategy.hasChanged(oldValue, newValue);
  }

  /**
   * Get change type
   * @param oldValue - Previous value
   * @param newValue - New value
   * @returns Change type
   */
  getChangeType(oldValue: unknown, newValue: unknown): ChangeEvent['type'] {
    const changeType = this.comparisonStrategy.detectChangeType(oldValue, newValue);

    switch (changeType) {
      case 'created':
        return 'created';
      case 'deleted':
        return 'deleted';
      case 'type':
        return 'type';
      case 'value':
        return 'value';
      default:
        return 'change';
    }
  }
}
