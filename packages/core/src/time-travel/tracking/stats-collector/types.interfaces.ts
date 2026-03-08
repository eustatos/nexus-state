/**
 * StatisticsCollector module interfaces
 * Enables dependency injection and testability
 */

import type { TrackedAtom, TrackingStats, CleanupResult } from '../types';
import type { RepositoryStats } from '../TrackedAtomsRepository';

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  totalCleanups: number;
  totalAtomsCleaned: number;
  totalAtomsFailed: number;
  lastCleanup?: CleanupResult;
  averageCleanedPerCleanup: number;
}

/**
 * Access statistics
 */
export interface AccessStats {
  totalAccesses: number;
  mostAccessed: Array<{ name: string; count: number }>;
  leastAccessed: Array<{ name: string; count: number }>;
}

/**
 * Cleanup history manager
 */
export interface ICleanupHistoryManager {
  /**
   * Record cleanup result
   */
  record(result: CleanupResult): void;

  /**
   * Get cleanup history
   */
  getHistory(): CleanupResult[];

  /**
   * Get cleanup statistics
   */
  getStats(): CleanupStats;

  /**
   * Clear history
   */
  clear(): void;
}

/**
 * Access tracker
 */
export interface IAccessTracker {
  /**
   * Record atom access
   */
  record(atomId: symbol): void;

  /**
   * Get access count for atom
   */
  getCount(atomId: symbol): number;

  /**
   * Get all access counts
   */
  getAllCounts(): Map<symbol, number>;

  /**
   * Get access statistics
   */
  getStats(atoms: TrackedAtom[]): AccessStats;

  /**
   * Reset access counts
   */
  reset(): void;
}

/**
 * Tracking stats collector
 */
export interface ITrackingStatsCollector {
  /**
   * Collect tracking statistics
   */
  collect(
    atoms: TrackedAtom[],
    repositoryStats?: RepositoryStats
  ): TrackingStats;
}

/**
 * Combined statistics provider
 */
export interface IStatsProvider {
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
  };

  /**
   * Clear all statistics
   */
  clear(): void;
}
