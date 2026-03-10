/**
 * StatisticsCollector - Collects and provides tracking statistics
 * Refactored version with dependency injection
 */

import type { TrackedAtom, TrackingStats, CleanupResult } from '../types';
import type { RepositoryStats } from '../TrackedAtomsRepository';
import type {
  ICleanupHistoryManager,
  IAccessTracker,
  ITrackingStatsCollector,
  IStatsProvider,
  CleanupStats,
  AccessStats,
} from './types.interfaces';
import { CleanupHistoryManager } from './CleanupHistoryManager';
import { AccessTracker } from './AccessTracker';
import { TrackingStatsCollector } from './TrackingStatsCollector';

/**
 * Dependencies for StatisticsCollector
 */
export interface StatsCollectorDeps {
  cleanupHistory?: ICleanupHistoryManager;
  accessTracker?: IAccessTracker;
  trackingCollector?: ITrackingStatsCollector;
  maxHistorySize?: number;
}

/**
 * StatisticsCollector with dependency injection
 */
export class StatisticsCollector implements IStatsProvider {
  private cleanupHistory: ICleanupHistoryManager;
  private accessTracker: IAccessTracker;
  private trackingCollector: ITrackingStatsCollector;

  constructor(deps?: StatsCollectorDeps) {
    this.cleanupHistory =
      deps?.cleanupHistory ?? new CleanupHistoryManager(deps?.maxHistorySize);
    this.accessTracker = deps?.accessTracker ?? new AccessTracker();
    this.trackingCollector = deps?.trackingCollector ?? new TrackingStatsCollector();
  }

  /**
   * Collect tracking statistics
   */
  collectTrackingStats(
    atoms: TrackedAtom[],
    repositoryStats?: RepositoryStats
  ): TrackingStats {
    return this.trackingCollector.collect(atoms, repositoryStats);
  }

  /**
   * Record cleanup result
   */
  recordCleanup(result: CleanupResult): void {
    this.cleanupHistory.record(result);
  }

  /**
   * Collect cleanup statistics
   */
  collectCleanupStats(): CleanupStats {
    return this.cleanupHistory.getStats();
  }

  /**
   * Record atom access
   */
  recordAccess(atomId: symbol): void {
    this.accessTracker.record(atomId);
  }

  /**
   * Collect access statistics
   */
  collectAccessStats(atoms: TrackedAtom[]): AccessStats {
    return this.accessTracker.getStats(atoms);
  }

  /**
   * Get all statistics
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
    this.cleanupHistory.clear();
    this.accessTracker.reset();
  }

  /**
   * Get cleanup history
   */
  getCleanupHistory(): CleanupResult[] {
    return this.cleanupHistory.getHistory();
  }

  /**
   * Get access count for atom
   */
  getAccessCount(atomId: symbol): number {
    return this.accessTracker.getCount(atomId);
  }

  /**
   * Reset access counts
   */
  resetAccessCounts(): void {
    this.accessTracker.reset();
  }

  /**
   * Get cleanup history manager
   */
  getCleanupHistoryManager(): ICleanupHistoryManager {
    return this.cleanupHistory;
  }

  /**
   * Get access tracker
   */
  getAccessTracker(): IAccessTracker {
    return this.accessTracker;
  }

  /**
   * Get tracking stats collector
   */
  getTrackingCollector(): ITrackingStatsCollector {
    return this.trackingCollector;
  }
}
