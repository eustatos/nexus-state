/**
 * AccessTracker - Tracks atom accesses
 */

import type { IAccessTracker, AccessStats } from './types.interfaces';
import type { TrackedAtom } from '../types';

/**
 * Default implementation of access tracker
 */
export class AccessTracker implements IAccessTracker {
  private accessCounts: Map<symbol, number> = new Map();

  /**
   * Record atom access
   */
  record(atomId: symbol): void {
    const count = this.accessCounts.get(atomId) || 0;
    this.accessCounts.set(atomId, count + 1);
  }

  /**
   * Get access count for atom
   */
  getCount(atomId: symbol): number {
    return this.accessCounts.get(atomId) || 0;
  }

  /**
   * Get all access counts
   */
  getAllCounts(): Map<symbol, number> {
    return new Map(this.accessCounts);
  }

  /**
   * Get access statistics
   */
  getStats(atoms: TrackedAtom[]): AccessStats {
    const totalAccesses = Array.from(this.accessCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // Get most and least accessed
    const atomAccessList = atoms
      .map((atom) => ({
        name: atom.name,
        count: this.accessCounts.get(atom.id) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    const mostAccessed = atomAccessList.slice(0, 10);
    const leastAccessed = atomAccessList
      .slice(-10)
      .reverse()
      .filter((a) => a.count > 0);

    return {
      totalAccesses,
      mostAccessed,
      leastAccessed,
    };
  }

  /**
   * Reset access counts
   */
  reset(): void {
    this.accessCounts.clear();
  }

  /**
   * Get number of tracked atoms
   */
  getTrackedCount(): number {
    return this.accessCounts.size;
  }
}
