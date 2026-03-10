/**
 * CleanupEngine - Performs cleanup of tracked atoms
 *
 * Handles the actual cleanup logic: selecting candidates,
 * applying cleanup strategies, and removing/archiving atoms.
 */

import type { TrackedAtom, CleanupResult } from './types';
import type { TrackedAtomsRepository } from './TrackedAtomsRepository';
import type { TTLManager } from './TTLManager';

export type CleanupStrategy = 'remove' | 'archive' | 'mark-stale';

export interface CleanupEngineConfig {
  /** Default cleanup strategy */
  defaultStrategy: CleanupStrategy;
  /** Remove expired atoms */
  removeExpired: boolean;
  /** Archive stale atoms */
  archiveStale: boolean;
  /** Dry run (don't actually clean up) */
  dryRun: boolean;
}

export interface CleanupCandidate {
  /** Atom to clean up */
  atom: TrackedAtom;
  /** Reason for cleanup */
  reason: 'stale' | 'idle' | 'no-subscribers';
  /** Recommended action */
  action: 'remove' | 'archive' | 'mark-stale';
}

/**
 * CleanupEngine provides cleanup execution
 * for tracked atoms
 */
export class CleanupEngine {
  private repository: TrackedAtomsRepository;
  private ttlManager: TTLManager;
  private config: CleanupEngineConfig;

  constructor(
    repository: TrackedAtomsRepository,
    ttlManager: TTLManager,
    config?: Partial<CleanupEngineConfig>
  ) {
    this.repository = repository;
    this.ttlManager = ttlManager;
    this.config = {
      defaultStrategy: config?.defaultStrategy ?? 'remove',
      removeExpired: config?.removeExpired ?? true,
      archiveStale: config?.archiveStale ?? false,
      dryRun: config?.dryRun ?? false,
    };
  }

  /**
   * Perform cleanup
   * @returns Cleanup result
   */
  performCleanup(): CleanupResult {
    const candidates = this.selectCandidates();
    const cleanedAtoms: string[] = [];
    const errors: string[] = [];
    let failedCount = 0;

    for (const candidate of candidates) {
      try {
        const cleaned = this.cleanupAtom(candidate);
        if (cleaned) {
          cleanedAtoms.push(candidate.atom.name);
        }
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to cleanup atom ${candidate.atom.name}: ${errorMessage}`);
      }
    }

    return {
      cleanedCount: cleanedAtoms.length,
      failedCount,
      cleanedAtoms,
      errors,
      strategy: this.config.defaultStrategy,
    };
  }

  /**
   * Select cleanup candidates
   * @returns Array of cleanup candidates
   */
  selectCandidates(): CleanupCandidate[] {
    const candidates: CleanupCandidate[] = [];
    const atoms = this.repository.getAll();

    for (const atom of atoms) {
      // Update status
      this.ttlManager.updateStatus(atom);

      // Check for stale atoms (treated as expired)
      if (this.config.removeExpired && atom.status === 'stale') {
        candidates.push({
          atom,
          reason: 'stale',
          action: 'remove',
        });
        continue;
      }

      // Check for atoms with no subscribers
      if (atom.subscribers && atom.subscribers.size === 0) {
        candidates.push({
          atom,
          reason: 'no-subscribers',
          action: this.config.defaultStrategy === 'archive' ? 'archive' : 'remove',
        });
      }
    }

    return candidates;
  }

  /**
   * Cleanup a single atom
   * @param candidate Cleanup candidate
   * @returns True if cleaned up successfully
   */
  cleanupAtom(candidate: CleanupCandidate): boolean {
    if (this.config.dryRun) {
      return false;
    }

    switch (candidate.action) {
      case 'remove':
        return this.repository.untrack(candidate.atom.id);

      case 'archive':
        // Archive logic would go here
        // For now, just mark as stale
        return this.repository.update(candidate.atom.id, {
          status: 'stale',
        });

      case 'mark-stale':
        return this.repository.update(candidate.atom.id, {
          status: 'stale',
        });

      default:
        return false;
    }
  }

  /**
   * Get cleanup preview (what would be cleaned up)
   * @returns Array of candidates that would be cleaned up
   */
  getCleanupPreview(): CleanupCandidate[] {
    const originalDryRun = this.config.dryRun;
    this.config.dryRun = true;
    
    try {
      return this.selectCandidates();
    } finally {
      this.config.dryRun = originalDryRun;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CleanupEngineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<CleanupEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set cleanup strategy
   * @param strategy Cleanup strategy
   */
  setStrategy(strategy: CleanupStrategy): void {
    this.config.defaultStrategy = strategy;
  }
}
