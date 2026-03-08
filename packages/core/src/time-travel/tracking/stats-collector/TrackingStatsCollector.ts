/**
 * TrackingStatsCollector - Collects tracking statistics
 */

import type { ITrackingStatsCollector } from './types.interfaces';
import type { TrackedAtom, TrackingStats } from '../types';
import type { RepositoryStats } from '../TrackedAtomsRepository';

/**
 * Default implementation of tracking stats collector
 */
export class TrackingStatsCollector implements ITrackingStatsCollector {
  /**
   * Collect tracking statistics
   */
  collect(
    atoms: TrackedAtom[],
    _repositoryStats?: RepositoryStats
  ): TrackingStats {
    const activeAtoms = atoms.filter((a) => a.status === 'active').length;
    const idleAtoms = atoms.filter((a) => a.status === 'idle').length;
    const staleAtoms = atoms.filter((a) => a.status === 'stale').length;
    const expiredAtoms = atoms.filter((a) => a.status === 'expired').length;

    // Calculate total accesses and changes
    const totalAccesses = atoms.reduce((sum, a) => sum + (a.accessCount || 0), 0);
    const totalChanges = atoms.reduce((sum, a) => sum + (a.changeCount || 0), 0);

    // Calculate atoms by type
    const byType: Record<string, number> = {};
    for (const atom of atoms) {
      const type = atom.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalAtoms: atoms.length,
      activeAtoms,
      idleAtoms,
      staleAtoms,
      expiredAtoms,
      totalAccesses,
      totalChanges,
      byType,
    };
  }

  /**
   * Calculate subscriber statistics
   */
  calculateSubscriberStats(atoms: TrackedAtom[]): {
    totalSubscribers: number;
    averageSubscribers: number;
    atomsWithNoSubscribers: number;
  } {
    let totalSubscribers = 0;
    let atomsWithNoSubscribers = 0;

    for (const atom of atoms) {
      const subscriberCount = atom.subscribers?.size || 0;
      totalSubscribers += subscriberCount;
      if (subscriberCount === 0) {
        atomsWithNoSubscribers++;
      }
    }

    return {
      totalSubscribers,
      averageSubscribers: atoms.length > 0 ? totalSubscribers / atoms.length : 0,
      atomsWithNoSubscribers,
    };
  }

  /**
   * Calculate status statistics
   */
  calculateStatusStats(atoms: TrackedAtom[]): {
    active: number;
    idle: number;
    stale: number;
    total: number;
  } {
    return {
      active: atoms.filter((a) => a.status === 'active').length,
      idle: atoms.filter((a) => a.status === 'idle').length,
      stale: atoms.filter((a) => a.status === 'stale').length,
      total: atoms.length,
    };
  }

  /**
   * Calculate type statistics
   */
  calculateTypeStats(atoms: TrackedAtom[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const atom of atoms) {
      const type = atom.type || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
    }

    return stats;
  }
}
