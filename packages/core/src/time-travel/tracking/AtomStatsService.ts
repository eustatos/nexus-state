/**
 * AtomStatsService - Service for tracking statistics
 *
 * Handles collection and retrieval of tracking statistics.
 */

import type { TrackedAtom, TrackingStats, CleanupStats } from './types';
import type { StatisticsCollector } from './StatisticsCollector';
import type { TrackedAtomsRepository } from './TrackedAtomsRepository';
import type { ArchiveManager } from './ArchiveManager';
import type { AtomCleanupService } from './AtomCleanupService';

export interface CombinedStats {
  /** Tracking statistics */
  tracking: TrackingStats;
  /** Cleanup statistics */
  cleanup: {
    totalCleanups: number;
    totalAtomsCleaned: number;
    totalAtomsFailed: number;
  };
  /** Archive statistics */
  archive: {
    totalArchived: number;
    byReason: Record<string, number>;
  };
  /** Repository statistics */
  repository: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

/**
 * AtomStatsService provides statistics collection
 */
export class AtomStatsService {
  private statsCollector: StatisticsCollector;
  private repository: TrackedAtomsRepository;
  private archiveManager: ArchiveManager;
  private cleanupService?: AtomCleanupService;

  constructor(
    statsCollector: StatisticsCollector,
    repository: TrackedAtomsRepository,
    archiveManager: ArchiveManager
  ) {
    this.statsCollector = statsCollector;
    this.repository = repository;
    this.archiveManager = archiveManager;
  }

  /**
   * Set cleanup service for combined stats
   * @param cleanupService Cleanup service
   */
  setCleanupService(cleanupService: AtomCleanupService): void {
    this.cleanupService = cleanupService;
  }

  /**
   * Get tracking statistics
   * @returns Tracking stats
   */
  getTrackingStats(): TrackingStats {
    const atoms = this.repository.getAll();
    const repositoryStats = this.repository.getStats();
    return this.statsCollector.collectTrackingStats(atoms, repositoryStats);
  }

  /**
   * Get cleanup statistics
   * @returns Cleanup stats
   */
  getCleanupStats(): CleanupStats {
    if (this.cleanupService) {
      const stats = this.cleanupService.getCleanupStats();
      return {
        totalCleanups: stats.totalCleanups,
        totalAtomsCleaned: stats.totalAtomsCleaned,
        totalAtomsFailed: stats.totalAtomsFailed,
        lastCleanup: stats.lastCleanup ?? null,
      };
    }

    return {
      totalCleanups: 0,
      totalAtomsCleaned: 0,
      totalAtomsFailed: 0,
      lastCleanup: null,
    };
  }

  /**
   * Get archive statistics
   * @returns Archive stats
   */
  getArchiveStats(): {
    totalArchived: number;
    byReason: Record<string, number>;
  } {
    const stats = this.archiveManager.getStats();
    return {
      totalArchived: stats.totalArchived,
      byReason: stats.byReason,
    };
  }

  /**
   * Get repository statistics
   * @returns Repository stats
   */
  getRepositoryStats(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    return this.repository.getStats();
  }

  /**
   * Get combined statistics
   * @returns Combined stats
   */
  getCombinedStats(): CombinedStats {
    return {
      tracking: this.getTrackingStats(),
      cleanup: this.getCleanupStats(),
      archive: this.getArchiveStats(),
      repository: this.getRepositoryStats(),
    };
  }

  /**
   * Get all stats (alias for backward compatibility)
   * @returns Combined stats
   */
  getAllStats(): CombinedStats {
    return this.getCombinedStats();
  }

  /**
   * Get stale atoms
   * @returns Array of stale atoms
   */
  getStaleAtoms(): TrackedAtom[] {
    return this.repository.getByStatus('stale');
  }

  /**
   * Get expired atoms
   * @returns Array of expired atoms
   */
  getExpiredAtoms(): TrackedAtom[] {
    return this.repository.getByStatus('expired');
  }

  /**
   * Get idle atoms
   * @returns Array of idle atoms
   */
  getIdleAtoms(): TrackedAtom[] {
    return this.repository.getByStatus('idle');
  }

  /**
   * Get active atoms
   * @returns Array of active atoms
   */
  getActiveAtoms(): TrackedAtom[] {
    return this.repository.getByStatus('active');
  }

  /**
   * Get stats collector
   */
  getStatsCollector(): StatisticsCollector {
    return this.statsCollector;
  }

  /**
   * Get repository
   */
  getRepository(): TrackedAtomsRepository {
    return this.repository;
  }

  /**
   * Get archive manager
   */
  getArchiveManager(): ArchiveManager {
    return this.archiveManager;
  }
}
