/**
 * StatisticsCollector - Collects and provides tracking statistics
 *
 * Gathers statistics about tracked atoms, cleanup operations,
 * and tracking system performance.
 */

import type { TrackedAtom, TrackingStats, CleanupResult } from './types';
import type { RepositoryStats } from './TrackedAtomsRepository';

export interface CleanupStats {
  /** Total cleanups performed */
  totalCleanups: number;
  /** Total atoms cleaned */
  totalAtomsCleaned: number;
  /** Total atoms failed to clean */
  totalAtomsFailed: number;
  /** Last cleanup result */
  lastCleanup?: CleanupResult;
  /** Average cleaned atoms per cleanup */
  averageCleanedPerCleanup: number;
}

export interface AccessStats {
  /** Total accesses */
  totalAccesses: number;
  /** Most accessed atoms */
  mostAccessed: Array<{ name: string; count: number }>;
  /** Least accessed atoms */
  leastAccessed: Array<{ name: string; count: number }>;
}

/**
 * StatisticsCollector provides statistics collection
 * for the tracking system
 */
export class StatisticsCollector {
  private cleanupHistory: CleanupResult[] = [];
  private accessCounts: Map<symbol, number> = new Map();
  private maxCleanupHistorySize: number = 100;

  constructor(maxHistorySize?: number) {
    this.maxCleanupHistorySize = maxHistorySize ?? 100;
  }

  /**
   * Collect tracking statistics
   * @param atoms Tracked atoms
   * @param repositoryStats Repository statistics
   * @returns Tracking stats
   */
  collectTrackingStats(
    atoms: TrackedAtom[],
    _repositoryStats?: RepositoryStats
  ): TrackingStats {
    const activeAtoms = atoms.filter((a) => a.status === 'active').length;
    const idleAtoms = atoms.filter((a) => a.status === 'idle').length;
    const staleAtoms = atoms.filter((a) => a.status === 'stale').length;
    const expiredAtoms = atoms.filter((a) => a.status === 'expired').length;

    // Count atoms by type
    const byType: Record<string, number> = {};
    atoms.forEach((atom) => {
      const type = atom.atom.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalAtoms: atoms.length,
      activeAtoms,
      idleAtoms,
      staleAtoms,
      expiredAtoms,
      totalAccesses: 0,
      totalChanges: 0,
      byType,
    };
  }

  /**
   * Record cleanup result
   * @param result Cleanup result
   */
  recordCleanup(result: CleanupResult): void {
    this.cleanupHistory.push(result);

    // Trim history if needed
    if (this.cleanupHistory.length > this.maxCleanupHistorySize) {
      this.cleanupHistory.shift();
    }
  }

  /**
   * Collect cleanup statistics
   * @returns Cleanup stats
   */
  collectCleanupStats(): CleanupStats {
    const totalCleanups = this.cleanupHistory.length;
    const totalAtomsCleaned = this.cleanupHistory.reduce(
      (sum, r) => sum + r.cleanedCount,
      0
    );
    const totalAtomsFailed = this.cleanupHistory.reduce(
      (sum, r) => sum + r.failedCount,
      0
    );
    const lastCleanup =
      this.cleanupHistory.length > 0
        ? this.cleanupHistory[this.cleanupHistory.length - 1]
        : undefined;

    return {
      totalCleanups,
      totalAtomsCleaned,
      totalAtomsFailed,
      lastCleanup,
      averageCleanedPerCleanup:
        totalCleanups > 0 ? totalAtomsCleaned / totalCleanups : 0,
    };
  }

  /**
   * Record atom access
   * @param atomId Atom ID
   */
  recordAccess(atomId: symbol): void {
    const count = this.accessCounts.get(atomId) || 0;
    this.accessCounts.set(atomId, count + 1);
  }

  /**
   * Collect access statistics
   * @param atoms Tracked atoms
   * @returns Access stats
   */
  collectAccessStats(atoms: TrackedAtom[]): AccessStats {
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
   * Get all statistics
   * @param atoms Tracked atoms
   * @param repositoryStats Repository statistics
   * @returns Combined statistics
   */
  getAllStats(
    atoms: TrackedAtom[],
    repositoryStats?: RepositoryStats
  ): {
    tracking: TrackingStats;
    cleanup: CleanupStats;
    access: AccessStats;
  } {
    return {
      tracking: this.collectTrackingStats(atoms, repositoryStats),
      cleanup: this.collectCleanupStats(),
      access: this.collectAccessStats(atoms),
    };
  }

  /**
   * Clear statistics
   */
  clear(): void {
    this.cleanupHistory.length = 0;
    this.accessCounts.clear();
  }

  /**
   * Get cleanup history
   * @returns Array of cleanup results
   */
  getCleanupHistory(): CleanupResult[] {
    return [...this.cleanupHistory];
  }

  /**
   * Get access count for atom
   * @param atomId Atom ID
   * @returns Access count
   */
  getAccessCount(atomId: symbol): number {
    return this.accessCounts.get(atomId) || 0;
  }

  /**
   * Reset access counts
   */
  resetAccessCounts(): void {
    this.accessCounts.clear();
  }
}
